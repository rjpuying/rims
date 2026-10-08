-- 012 Audit logs and system settings

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint chk_audit_action check (length(trim(action)) > 0),
  constraint chk_audit_entity_type check (length(trim(entity_type)) > 0)
);

create index idx_audit_logs_user on public.audit_logs (user_id, created_at desc);
create index idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);
create index idx_audit_logs_created on public.audit_logs (created_at desc);
create index idx_audit_logs_action on public.audit_logs (action);

create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_system_setting_key check (setting_key ~ '^[a-z0-9_]+$')
);

create trigger trg_system_settings_updated_at before update on public.system_settings
  for each row execute function public.set_updated_at();
