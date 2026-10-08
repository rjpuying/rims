-- 003 User profiles and auth trigger
-- Supabase Auth owns auth.users; this table owns identity/role data.

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  role_id uuid not null references public.roles(id) on delete restrict,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_auth_user_id on public.profiles (auth_user_id);
create index idx_profiles_role_id on public.profiles (role_id);
create index idx_profiles_full_name on public.profiles (full_name);

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile whenever an auth user is created.
-- The very first user becomes SUPER_ADMIN (bootstrap); every later user
-- starts as OTHER_STAFF and is promoted through Users & Roles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_count bigint;
  v_role_id uuid;
  v_full_name text;
begin
  select count(*) into v_profile_count from public.profiles;

  if v_profile_count = 0 then
    select id into v_role_id from public.roles where name = 'SUPER_ADMIN';
  else
    select id into v_role_id from public.roles where name = 'OTHER_STAFF';
  end if;

  v_full_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, 'user'), '@', 1)
  );

  insert into public.profiles (auth_user_id, full_name, email, role_id)
  values (new.id, v_full_name, new.email, v_role_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on function public.handle_new_user() is
  'Creates a profile row for each new auth user. First user becomes SUPER_ADMIN.';

-- ---------------------------------------------------------------------------
-- Authorization helper functions (used by RLS and storage policies)
-- ---------------------------------------------------------------------------

create or replace function public.get_current_user_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select *
  from public.profiles
  where auth_user_id = auth.uid();
$$;

create or replace function public.get_current_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select r.name
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.auth_user_id = auth.uid() and p.is_active;
$$;

create or replace function public.has_permission(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role_id = p.role_id
    join public.permissions perm on perm.id = rp.permission_id
    where p.auth_user_id = auth.uid()
      and p.is_active
      and perm.code = p_code
  );
$$;

comment on function public.has_permission(text) is
  'True when the authenticated user''s active profile role grants the permission code.';
comment on function public.get_current_user_profile() is
  'Profile row of the authenticated user.';
comment on function public.get_current_user_role() is
  'Role name of the authenticated user, or NULL when not authenticated/inactive.';
