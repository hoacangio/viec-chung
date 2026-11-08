-- LOCAL TESTING ONLY — mimics the bits of Supabase the migration relies on.
-- Never run this on a real Supabase project.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
-- Like Supabase: extensions live in their own schema, not in public.
create schema if not exists extensions;
create extension if not exists pgcrypto schema extensions;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- Supabase's default privileges: API roles get table privileges; RLS does the gating.
alter default privileges in schema public grant all on tables to anon, authenticated;
