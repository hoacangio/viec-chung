-- RLS + RPC tests. Run against a scratch DB after the auth stub and the migration.
-- Any failed assertion raises and stops the script (psql -v ON_ERROR_STOP=1).
\set ON_ERROR_STOP 1
\set a '''aaaaaaaa-0000-0000-0000-00000000000a'''
\set b '''bbbbbbbb-0000-0000-0000-00000000000b'''
\set c '''cccccccc-0000-0000-0000-00000000000c'''

insert into auth.users values (:a), (:b), (:c);
create temp table ctx (k text primary key, v text);
grant all on ctx to authenticated;

set role authenticated;

-- 1. Anh creates the household
select set_config('request.jwt.claim.sub', :a, false);
insert into ctx select 'hid', id::text from public.create_household('Anh');
insert into ctx select 'code', invite_code from public.households;
do $$ begin
  assert (select length(v) from ctx where k = 'code') = 8, 'invite code is 8 chars';
  assert (select role from public.household_members) = 'owner', 'creator is owner';
end $$;

-- 2. A stranger sees nothing and a wrong code returns NULL
select set_config('request.jwt.claim.sub', :c, false);
do $$ begin
  assert (select count(*) from public.households) = 0, 'stranger cannot see household';
  assert public.join_household('WRONG123', 'Lạ') is null, 'wrong code returns null';
end $$;

-- 3. Em joins with the code (lowercase + spaces tolerated); the code is then burned
select set_config('request.jwt.claim.sub', :b, false);
do $$ begin
  assert public.join_household(lower(' ' || (select v from ctx where k = 'code') || ' '), 'Em')
         = (select v::uuid from ctx where k = 'hid'), 'partner joins';
  assert (select invite_code from public.households) is null, 'code is single-use';
  assert (select count(*) from public.household_members) = 2, 'partner sees 2 members';
  begin
    perform public.join_household('ANYCODE1', 'Em');
    assert false, 'second join must fail';
  exception when raise_exception then
    assert sqlerrm = 'already_in_household', sqlerrm;
  end;
end $$;

-- 4. Anh adds items; assignee must be a member
select set_config('request.jwt.claim.sub', :a, false);
insert into public.items (household_id, title, assignee_id, due_at)
  select v::uuid, '  Đón bé ở trường  ', :b, now() + interval '3 hours' from ctx where k = 'hid';
insert into public.items (household_id, kind, title)
  select v::uuid, 'shopping', 'Sữa bột' from ctx where k = 'hid';
do $$ begin
  assert (select title from public.items where kind = 'task') = 'Đón bé ở trường', 'title trimmed';
  assert (select created_by from public.items where kind = 'task') = auth.uid(), 'created_by forced';
  begin
    insert into public.items (household_id, title, assignee_id)
      select v::uuid, 'x', 'cccccccc-0000-0000-0000-00000000000c' from ctx where k = 'hid';
    assert false, 'non-member assignee must fail';
  exception when raise_exception then
    assert sqlerrm = 'assignee must be a household member', sqlerrm;
  end;
end $$;

-- 5. Stranger cannot read, write, update or delete
select set_config('request.jwt.claim.sub', :c, false);
do $$
declare n int;
begin
  assert (select count(*) from public.items) = 0, 'stranger sees no items';
  begin
    insert into public.items (household_id, title) select v::uuid, 'hack' from ctx where k = 'hid';
    assert false, 'stranger insert must fail';
  exception when insufficient_privilege then null;
  end;
  update public.items set title = 'hacked'; get diagnostics n = row_count;
  assert n = 0, 'stranger update affects 0 rows';
  delete from public.items; get diagnostics n = row_count;
  assert n = 0, 'stranger delete affects 0 rows';
end $$;

-- 6. Em ticks the task: done_by / done_at are set by the server
select set_config('request.jwt.claim.sub', :b, false);
update public.items set done = true, done_by = :a where kind = 'task';
do $$ begin
  assert (select done_by from public.items where kind = 'task') = auth.uid(), 'done_by is the ticker, not the client value';
  assert (select done_at from public.items where kind = 'task') is not null, 'done_at set';
end $$;
update public.items set done = false where kind = 'task';
do $$ begin
  assert (select done_by from public.items where kind = 'task') is null, 'untick clears done_by';
end $$;

-- 7. Members cannot tamper with invite code or other members' names
do $$
declare n int;
begin
  begin
    update public.households set invite_code = 'AAAAAAAA';
    assert false, 'invite_code must not be client-writable';
  exception when insufficient_privilege then null;
  end;
  update public.household_members set display_name = 'Bị đổi'
   where user_id = 'aaaaaaaa-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  assert n = 0, 'cannot rename another member';
  update public.household_members set display_name = 'Vợ yêu' where user_id = auth.uid();
  get diagnostics n = row_count;
  assert n = 1, 'can rename self';
end $$;

-- 8. Join attempts are rate-limited (stranger already used 1 of 10)
select set_config('request.jwt.claim.sub', :c, false);
do $$ begin
  for i in 1..9 loop perform public.join_household('NOPE' || i, 'Lạ'); end loop;
  begin
    perform public.join_household('NOPE10', 'Lạ');
    assert false, '11th attempt must be blocked';
  exception when raise_exception then
    assert sqlerrm = 'too_many_attempts', sqlerrm;
  end;
  assert (select count(*) from public.join_attempts) = 0, 'join_attempts not readable by clients';
end $$;

-- 9. Anon gets nothing
reset role;
set role anon;
do $$ begin
  assert (select count(*) from public.items) = 0, 'anon sees no items';
end $$;
reset role;

\echo 'ALL RLS TESTS PASSED'
