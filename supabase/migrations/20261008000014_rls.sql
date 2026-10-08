-- 014 Row Level Security
-- Principle: clients READ what their role permits; all inventory/transaction
-- WRITES happen inside SECURITY DEFINER RPC functions (see 015).
-- Table owner (postgres) bypasses RLS, so RPCs are unaffected.

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.rice_products enable row level security;
alter table public.rice_product_images enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.rejected_stock enable row level security;
alter table public.deliveries enable row level security;
alter table public.delivery_items enable row level security;
alter table public.delivery_batches enable row level security;
alter table public.palay_receipts enable row level security;
alter table public.palay_receipt_items enable row level security;
alter table public.palay_inventory_balances enable row level security;
alter table public.palay_conversions enable row level security;
alter table public.rebagging_transactions enable row level security;
alter table public.rebagging_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_payments enable row level security;
alter table public.reseller_transfers enable row level security;
alter table public.reseller_transfer_items enable row level security;
alter table public.reseller_transfer_payments enable row level security;
alter table public.credits enable row level security;
alter table public.credit_payments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;
alter table public.transaction_counters enable row level security;

-- ---------------------------------------------------------------------------
-- Read policies
-- ---------------------------------------------------------------------------

-- Profiles: your own row, or any row if you can view users
create policy "profiles_select_own_or_users_view"
  on public.profiles for select
  to authenticated
  using (auth.uid() = auth_user_id or public.has_permission('users.view'));

create policy "roles_select_authenticated"
  on public.roles for select to authenticated using (true);

create policy "permissions_select_authenticated"
  on public.permissions for select to authenticated using (true);

create policy "role_permissions_select_authenticated"
  on public.role_permissions for select to authenticated using (true);

create policy "rice_products_select"
  on public.rice_products for select to authenticated
  using (public.has_permission('inventory.view'));

create policy "rice_product_images_select"
  on public.rice_product_images for select to authenticated
  using (public.has_permission('inventory.view'));

create policy "inventory_balances_select"
  on public.inventory_balances for select to authenticated
  using (public.has_permission('inventory.view'));

create policy "inventory_movements_select"
  on public.inventory_movements for select to authenticated
  using (public.has_permission('inventory.view'));

create policy "rejected_stock_select"
  on public.rejected_stock for select to authenticated
  using (public.has_permission('inventory.view'));

create policy "deliveries_select"
  on public.deliveries for select to authenticated
  using (public.has_permission('delivery.view'));

create policy "delivery_items_select"
  on public.delivery_items for select to authenticated
  using (public.has_permission('delivery.view'));

create policy "delivery_batches_select"
  on public.delivery_batches for select to authenticated
  using (public.has_permission('delivery.view'));

create policy "palay_receipts_select"
  on public.palay_receipts for select to authenticated
  using (public.has_permission('palay.view'));

create policy "palay_receipt_items_select"
  on public.palay_receipt_items for select to authenticated
  using (public.has_permission('palay.view'));

create policy "palay_inventory_select"
  on public.palay_inventory_balances for select to authenticated
  using (public.has_permission('palay.view'));

create policy "palay_conversions_select"
  on public.palay_conversions for select to authenticated
  using (public.has_permission('palay.view'));

create policy "rebagging_transactions_select"
  on public.rebagging_transactions for select to authenticated
  using (public.has_permission('rebagging.view'));

create policy "rebagging_items_select"
  on public.rebagging_items for select to authenticated
  using (public.has_permission('rebagging.view'));

create policy "sales_select"
  on public.sales for select to authenticated
  using (public.has_permission('sales.view'));

create policy "sale_items_select"
  on public.sale_items for select to authenticated
  using (public.has_permission('sales.view'));

create policy "sale_payments_select"
  on public.sale_payments for select to authenticated
  using (public.has_permission('sales.view'));

create policy "reseller_transfers_select"
  on public.reseller_transfers for select to authenticated
  using (public.has_permission('transfer.view'));

create policy "reseller_transfer_items_select"
  on public.reseller_transfer_items for select to authenticated
  using (public.has_permission('transfer.view'));

create policy "reseller_transfer_payments_select"
  on public.reseller_transfer_payments for select to authenticated
  using (public.has_permission('transfer.view'));

create policy "credits_select"
  on public.credits for select to authenticated
  using (public.has_permission('credits.view'));

create policy "credit_payments_select"
  on public.credit_payments for select to authenticated
  using (public.has_permission('credits.view'));

create policy "audit_logs_select"
  on public.audit_logs for select to authenticated
  using (public.has_permission('users.view'));

create policy "system_settings_select"
  on public.system_settings for select to authenticated using (true);

-- transaction_counters has no read policy: only next_transaction_number() uses it.

-- ---------------------------------------------------------------------------
-- Direct write policies (everything else is RPC-only)
-- ---------------------------------------------------------------------------

create policy "rice_products_insert"
  on public.rice_products for insert to authenticated
  with check (public.has_permission('inventory.adjust'));

create policy "rice_products_update"
  on public.rice_products for update to authenticated
  using (public.has_permission('inventory.adjust'))
  with check (public.has_permission('inventory.adjust'));

create policy "rice_product_images_insert"
  on public.rice_product_images for insert to authenticated
  with check (public.has_permission('inventory.adjust'));

create policy "rice_product_images_update"
  on public.rice_product_images for update to authenticated
  using (public.has_permission('inventory.adjust'))
  with check (public.has_permission('inventory.adjust'));

create policy "rice_product_images_delete"
  on public.rice_product_images for delete to authenticated
  using (public.has_permission('inventory.adjust'));

-- Profiles are edited through Users & Roles only (self-service is limited
-- to nothing here: the app never lets a user edit their own row directly).
create policy "profiles_update_users_update"
  on public.profiles for update to authenticated
  using (public.has_permission('users.update'))
  with check (public.has_permission('users.update'));

create policy "system_settings_insert"
  on public.system_settings for insert to authenticated
  with check (public.has_permission('settings.update'));

create policy "system_settings_update"
  on public.system_settings for update to authenticated
  using (public.has_permission('settings.update'))
  with check (public.has_permission('settings.update'));

-- ---------------------------------------------------------------------------
-- Privilege escalation guard on profiles
-- ---------------------------------------------------------------------------

create or replace function public.guard_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_target_role text;
begin
  -- Service role / migrations (no JWT) are allowed.
  if v_actor_id is null then
    return new;
  end if;

  v_actor_role := public.get_current_user_role();

  if new.role_id is distinct from old.role_id then
    -- Nobody may edit their own role except SUPER_ADMIN.
    if new.auth_user_id = v_actor_id and v_actor_role <> 'SUPER_ADMIN' then
      raise exception 'You cannot change your own role.';
    end if;

    -- Only SUPER_ADMIN may grant the SUPER_ADMIN role.
    select name into v_target_role from public.roles where id = new.role_id;
    if v_target_role = 'SUPER_ADMIN' and v_actor_role <> 'SUPER_ADMIN' then
      raise exception 'Only a Super Admin can grant the Super Admin role.';
    end if;
  end if;

  -- Nobody may deactivate their own account.
  if new.is_active = false and old.is_active = true and new.auth_user_id = v_actor_id then
    raise exception 'You cannot deactivate your own account.';
  end if;

  return new;
end;
$$;

create trigger trg_profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_changes();

comment on function public.guard_profile_changes() is
  'Blocks self role escalation, unauthorized Super Admin grants, and self-deactivation.';
