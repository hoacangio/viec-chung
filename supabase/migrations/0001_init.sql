-- Nhà mình — MVP schema: households, members, items (tasks + shopping), RLS, RPCs.
-- Run once in Supabase Dashboard → SQL Editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ───────────────────────── Tables ─────────────────────────

create table public.households (
  id                uuid primary key default gen_random_uuid(),
  name              text not null default 'Nhà mình' check (char_length(name) between 1 and 60),
  invite_code       text unique,
  invite_expires_at timestamptz,
  created_by        uuid not null references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'partner' check (role in ('owner', 'partner', 'helper')),
  display_name text not null check (char_length(display_name) between 1 and 40),
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_idx on public.household_members (user_id);

create table public.items (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kind         text not null default 'task' check (kind in ('task', 'shopping')),
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  assignee_id  uuid references auth.users(id) on delete set null,
  due_at       timestamptz,
  done         boolean not null default false,
  done_by      uuid references auth.users(id) on delete set null,
  done_at      timestamptz,
  created_by   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index items_household_idx on public.items (household_id, kind, done, due_at);

-- Join attempts, for rate-limiting invite-code guessing. Not readable by clients.
create table public.join_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  at      timestamptz not null default now()
);
create index join_attempts_user_idx on public.join_attempts (user_id, at);

-- ───────────────────────── Helpers ─────────────────────────

create or replace function public.is_member_of(p_household uuid, p_user uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = p_household and user_id = p_user
  );
$$;

create or replace function public.is_member(p_household uuid)
returns boolean
language sql stable security definer set search_path = public
as $$ select public.is_member_of(p_household, auth.uid()); $$;

create or replace function public.gen_invite_code()
returns text
language plpgsql volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no 0/O, 1/I/L
  code text := '';
  b bytea := gen_random_bytes(8);
begin
  for i in 0..7 loop
    code := code || substr(alphabet, (get_byte(b, i) % length(alphabet)) + 1, 1);
  end loop;
  return code;
end;
$$;

-- items: keep audit fields consistent, whatever the client sends.
create or replace function public.items_before_write()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
  else
    if new.household_id <> old.household_id then
      raise exception 'household_id is immutable';
    end if;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;

  if new.assignee_id is not null and not public.is_member_of(new.household_id, new.assignee_id) then
    raise exception 'assignee must be a household member';
  end if;

  if new.done and (tg_op = 'INSERT' or not old.done) then
    new.done_by := auth.uid();
    new.done_at := now();
  elsif not new.done then
    new.done_by := null;
    new.done_at := null;
  else
    new.done_by := old.done_by;
    new.done_at := old.done_at;
  end if;

  new.title := btrim(new.title);
  new.updated_at := now();
  return new;
end;
$$;

create trigger items_before_write
before insert or update on public.items
for each row execute function public.items_before_write();

-- ───────────────────────── RPCs ─────────────────────────

-- Create a household; the caller becomes its owner. One household per user in the MVP.
create or replace function public.create_household(p_display_name text, p_name text default 'Nhà mình')
returns public.households
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  h public.households;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.household_members where user_id = uid) then
    raise exception 'already_in_household';
  end if;

  insert into public.households (name, created_by, invite_code, invite_expires_at)
  values (coalesce(nullif(btrim(p_name), ''), 'Nhà mình'), uid, public.gen_invite_code(), now() + interval '24 hours')
  returning * into h;

  insert into public.household_members (household_id, user_id, role, display_name)
  values (h.id, uid, 'owner', btrim(p_display_name));

  return h;
end;
$$;

-- Issue a fresh single-use invite code (valid 24h).
create or replace function public.new_invite_code(p_household uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  code text := public.gen_invite_code();
begin
  if not public.is_member(p_household) then raise exception 'not_a_member'; end if;
  update public.households
     set invite_code = code, invite_expires_at = now() + interval '24 hours'
   where id = p_household;
  return code;
end;
$$;

-- Join with a code. Returns the household id, or NULL when the code is wrong/expired
-- (returning instead of raising keeps the attempt row for rate limiting).
create or replace function public.join_household(p_code text, p_display_name text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  h public.households;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.household_members where user_id = uid) then
    raise exception 'already_in_household';
  end if;
  if (select count(*) from public.join_attempts
       where user_id = uid and at > now() - interval '1 hour') >= 10 then
    raise exception 'too_many_attempts';
  end if;

  insert into public.join_attempts (user_id) values (uid);

  select * into h from public.households
   where invite_code = upper(btrim(p_code)) and invite_expires_at > now()
   for update;
  if not found then return null; end if;

  if (select count(*) from public.household_members where household_id = h.id) >= 6 then
    raise exception 'household_full';
  end if;

  insert into public.household_members (household_id, user_id, role, display_name)
  values (h.id, uid, 'partner', btrim(p_display_name));

  update public.households set invite_code = null, invite_expires_at = null where id = h.id;
  return h.id;
end;
$$;

-- ───────────────────────── RLS ─────────────────────────

alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.items             enable row level security;
alter table public.join_attempts     enable row level security; -- no policies: clients get nothing

create policy households_select on public.households
  for select to authenticated using (public.is_member(id));
create policy households_update on public.households
  for update to authenticated using (public.is_member(id)) with check (public.is_member(id));

create policy members_select on public.household_members
  for select to authenticated using (public.is_member(household_id));
create policy members_update_self on public.household_members
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy members_leave on public.household_members
  for delete to authenticated using (user_id = auth.uid());

create policy items_select on public.items
  for select to authenticated using (public.is_member(household_id));
create policy items_insert on public.items
  for insert to authenticated with check (public.is_member(household_id));
create policy items_update on public.items
  for update to authenticated using (public.is_member(household_id)) with check (public.is_member(household_id));
create policy items_delete on public.items
  for delete to authenticated using (public.is_member(household_id));

-- Members may rename the household but not touch the invite code or creator directly.
revoke update on public.households from authenticated;
grant update (name) on public.households to authenticated;
-- Members may only change their own display name.
revoke update on public.household_members from authenticated;
grant update (display_name) on public.household_members to authenticated;

revoke all on function public.create_household(text, text) from public, anon;
revoke all on function public.new_invite_code(uuid)        from public, anon;
revoke all on function public.join_household(text, text)   from public, anon;
grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.new_invite_code(uuid)        to authenticated;
grant execute on function public.join_household(text, text)   to authenticated;

-- ───────────────────────── Realtime ─────────────────────────

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.items, public.household_members;
  end if;
end $$;
