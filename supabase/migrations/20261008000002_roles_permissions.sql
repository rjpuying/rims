-- 002 Roles, permissions, and role-permission mapping
-- Roles: SUPER_ADMIN, OWNER, MANAGER, SECRETARY, OTHER_STAFF

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_name_format check (name ~ '^[A-Z_]+$')
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz not null default now(),
  constraint permissions_code_format check (code ~ '^[a-z_]+\.[a-z_]+$')
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create index idx_roles_updated_at on public.roles (updated_at);
create index idx_role_permissions_permission on public.role_permissions (permission_id);

create trigger trg_roles_updated_at before update on public.roles
  for each row execute function public.set_updated_at();

-- Permission catalog (database_architecture.md §9)
insert into public.permissions (code, description) values
  ('dashboard.view', 'View dashboard'),
  ('sales.view', 'View sales'),
  ('sales.create', 'Create sales'),
  ('sales.update', 'Update sales'),
  ('sales.cancel', 'Cancel sales'),
  ('inventory.view', 'View inventory'),
  ('inventory.adjust', 'Adjust inventory and manage products'),
  ('inventory.reject', 'Reject stock'),
  ('delivery.view', 'View deliveries'),
  ('delivery.create', 'Create deliveries'),
  ('delivery.update', 'Update deliveries'),
  ('palay.view', 'View palay'),
  ('palay.create', 'Create palay receipts'),
  ('palay.update', 'Update palay receipts'),
  ('rebagging.view', 'View rebagging'),
  ('rebagging.create', 'Create rebagging transactions'),
  ('transfer.view', 'View reseller transfers'),
  ('transfer.create', 'Create reseller transfers'),
  ('transfer.update', 'Update reseller transfers'),
  ('credits.view', 'View credits'),
  ('credits.create', 'Create credits'),
  ('credits.payment', 'Record credit payments'),
  ('reports.view', 'View reports'),
  ('users.view', 'View users'),
  ('users.create', 'Create users'),
  ('users.update', 'Update users'),
  ('users.deactivate', 'Deactivate users'),
  ('settings.view', 'View settings'),
  ('settings.update', 'Update settings');

-- Role seed (features.md §7)
insert into public.roles (name, description) values
  ('SUPER_ADMIN', 'Full access to every module'),
  ('OWNER', 'Full business access, view users'),
  ('MANAGER', 'Full business access'),
  ('SECRETARY', 'Day-to-day transaction entry'),
  ('OTHER_STAFF', 'Limited permissions assigned by an administrator');

-- Role permission mapping
with p as (select id, code from public.permissions),
     r as (select id, name from public.roles)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from r
join p on true
where
  -- SUPER_ADMIN: everything
  r.name = 'SUPER_ADMIN'
  or
  -- OWNER: all modules + view users (features.md §7)
  (r.name = 'OWNER' and p.code in (
    'dashboard.view',
    'sales.view','sales.create','sales.update','sales.cancel',
    'inventory.view','inventory.adjust','inventory.reject',
    'delivery.view','delivery.create','delivery.update',
    'palay.view','palay.create','palay.update',
    'rebagging.view','rebagging.create',
    'transfer.view','transfer.create','transfer.update',
    'credits.view','credits.create','credits.payment',
    'reports.view',
    'users.view'
  ))
  or
  -- MANAGER: all business modules, no user/settings admin
  (r.name = 'MANAGER' and p.code in (
    'dashboard.view',
    'sales.view','sales.create','sales.update','sales.cancel',
    'inventory.view','inventory.adjust','inventory.reject',
    'delivery.view','delivery.create','delivery.update',
    'palay.view','palay.create','palay.update',
    'rebagging.view','rebagging.create',
    'transfer.view','transfer.create','transfer.update',
    'credits.view','credits.create','credits.payment',
    'reports.view'
  ))
  or
  -- SECRETARY: transaction entry only (no inventory admin, no reports, no users/settings)
  (r.name = 'SECRETARY' and p.code in (
    'dashboard.view',
    'sales.view','sales.create',
    'delivery.view','delivery.create',
    'palay.view','palay.create',
    'rebagging.view','rebagging.create',
    'transfer.view','transfer.create',
    'credits.view','credits.create','credits.payment'
  ))
  or
  -- OTHER_STAFF: no default permissions; granted individually by an administrator
  false
on conflict do nothing;
