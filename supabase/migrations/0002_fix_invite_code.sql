-- Fix: "function gen_random_bytes(integer) does not exist" on Supabase.
-- Supabase installs pgcrypto in the `extensions` schema, but our functions pin
-- search_path = public. Use core gen_random_uuid() (122 random bits, no extension)
-- as the randomness source instead.

create or replace function public.gen_invite_code()
returns text
language plpgsql volatile
set search_path = pg_catalog, public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no 0/O, 1/I/L
  b bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex'); -- 16 bytes
  code text := '';
  i int;
begin
  -- Skip byte 6 (UUID version nibble) and byte 8 (variant bits): they are not random.
  foreach i in array array[0, 1, 2, 3, 4, 5, 7, 9] loop
    code := code || substr(alphabet, (get_byte(b, i) % length(alphabet)) + 1, 1);
  end loop;
  return code;
end;
$$;
