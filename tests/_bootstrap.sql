-- Test bootstrap: five throwaway users (one per role) plus assertion helpers.
-- This file runs inside the test transaction and is rolled back afterwards,
-- so the remote database is never mutated.

-- ---------------------------------------------------------------------------
-- Test users
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'admin@rims.test.local', 'not-a-real-hash', now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Test Admin"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'owner@rims.test.local', 'not-a-real-hash', now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Test Owner"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'manager@rims.test.local', 'not-a-real-hash', now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Test Manager"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004',
   'authenticated', 'authenticated', 'secretary@rims.test.local', 'not-a-real-hash', now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Test Secretary"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000005',
   'authenticated', 'authenticated', 'staff@rims.test.local', 'not-a-real-hash', now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Test Staff"}'::jsonb, now(), now())
on conflict (id) do nothing;

update public.profiles set role_id = (select id from public.roles where name = 'SUPER_ADMIN')
  where auth_user_id = '00000000-0000-0000-0000-000000000001';
update public.profiles set role_id = (select id from public.roles where name = 'OWNER')
  where auth_user_id = '00000000-0000-0000-0000-000000000002';
update public.profiles set role_id = (select id from public.roles where name = 'MANAGER')
  where auth_user_id = '00000000-0000-0000-0000-000000000003';
update public.profiles set role_id = (select id from public.roles where name = 'SECRETARY')
  where auth_user_id = '00000000-0000-0000-0000-000000000004';
update public.profiles set role_id = (select id from public.roles where name = 'OTHER_STAFF')
  where auth_user_id = '00000000-0000-0000-0000-000000000005';

-- ---------------------------------------------------------------------------
-- Helpers (rolled back with the transaction)
-- ---------------------------------------------------------------------------

-- Impersonate a test user: fills request.jwt.claims so auth.uid() resolves.
create or replace function public.test_login(p_email text)
returns void
language plpgsql
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where email = p_email;
  if v_id is null then
    raise exception 'FAIL | no test user with email %', p_email;
  end if;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_id::text, 'role', 'authenticated', 'aud', 'authenticated', 'email', p_email)::text,
    true);
end;
$$;

-- Clear JWT claims (anonymous session).
create or replace function public.test_login_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '', true);
end;
$$;

create or replace function public.test_assert(p_ok boolean, p_label text)
returns void
language plpgsql
as $$
begin
  if coalesce(p_ok, false) then
    raise notice 'PASS | %', p_label;
  else
    raise exception 'FAIL | %', p_label;
  end if;
end;
$$;

create or replace function public.test_num_eq(p_actual numeric, p_expected numeric, p_label text)
returns void
language plpgsql
as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FAIL | % (actual=%, expected=%)', p_label, p_actual, p_expected;
  end if;
  raise notice 'PASS | %', p_label;
end;
$$;

create or replace function public.test_text_eq(p_actual text, p_expected text, p_label text)
returns void
language plpgsql
as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FAIL | % (actual=%, expected=%)', p_label, p_actual, p_expected;
  end if;
  raise notice 'PASS | %', p_label;
end;
$$;

-- Runs p_sql and expects it to fail with an error containing p_expected.
create or replace function public.test_expect_error(p_sql text, p_expected text, p_label text)
returns void
language plpgsql
as $$
declare
  v_msg text := null;
begin
  begin
    execute p_sql;
  exception when others then
    v_msg := sqlerrm;
  end;

  if v_msg is null then
    raise exception 'FAIL | % — expected an error, but the statement succeeded', p_label;
  end if;
  if p_expected is not null and position(p_expected in v_msg) = 0 then
    raise exception 'FAIL | % — expected error containing "%", got: %', p_label, p_expected, v_msg;
  end if;
  raise notice 'PASS | % (rejected with: %)', p_label, v_msg;
end;
$$;

-- SECURITY DEFINER lookups so roles without read access (Secretary, Other
-- Staff) can still be driven through RPC flows and asserted on.
create or replace function public.test_product_id(p_name text)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from public.rice_products where rice_name = p_name and is_active;
$$;

create or replace function public.test_stock(p_name text, p_type public.sack_size_type, p_size numeric)
returns table (full_sacks numeric, loose_kg numeric, rejected_sacks numeric)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select b.full_sacks, b.loose_kg, b.rejected_sacks
  from public.inventory_balances b
  join public.rice_products p on p.id = b.rice_product_id
  where p.rice_name = p_name and b.sack_size_type = p_type and b.sack_size_kg = p_size;
$$;

create or replace function public.test_palay_kg(p_name text)
returns numeric
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(sum(b.quantity_kg), 0)
  from public.palay_inventory_balances b
  join public.rice_products p on p.id = b.rice_product_id
  where p.rice_name = p_name;
$$;
