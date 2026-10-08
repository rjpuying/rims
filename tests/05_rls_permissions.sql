-- §77 RLS / permission tests: Secretary, Other Staff, anonymous users,
-- direct table access, and the profile privilege-escalation guard.

-- Setup as owner: stock + one sale so there is data to try to read.
select public.test_login('owner@rims.test.local');
set local role authenticated;

do $$
declare
  v_pid uuid := public.test_product_id('Princess Bea');
begin
  perform public.receive_delivery(jsonb_build_object(
    'supplier_name', 'Test Supplier Inc.',
    'amount_paid', 13000,
    'items', jsonb_build_array(jsonb_build_object(
      'rice_product_id', v_pid,
      'sack_size_type', '25KG',
      'sack_size_kg', 25,
      'quantity_sacks', 10,
      'price_per_sack', 1300,
      'batch_number', 'BATCH-RLS'))));

  perform public.process_sale(jsonb_build_object(
    'payment_method', 'CASH',
    'amount_paid', 2800,
    'items', jsonb_build_array(jsonb_build_object(
      'rice_product_id', v_pid,
      'selling_method', 'PER_SACK',
      'sack_size_type', '25KG',
      'sack_size_kg', 25,
      'quantity_sacks', 2,
      'price_per_sack', 1400))));
end;
$$;

-- ---------------------------------------------------------------------------
-- SECRETARY: transaction entry works, admin surfaces are closed
-- ---------------------------------------------------------------------------
reset role;
select public.test_login('secretary@rims.test.local');
set local role authenticated;

do $$
declare
  v_pid uuid := public.test_product_id('Princess Bea');
  v_n integer;
  v_full numeric;
  v_stock numeric;
  v_ok boolean;
  v_name text;
begin
  -- Allowed: read the product catalog and enter a sale
  select jsonb_array_length(public.get_product_catalog()) into v_n;
  perform public.test_assert(v_n > 0, 'SEC: product catalog readable (POS product picker works)');

  perform public.process_sale(jsonb_build_object(
    'payment_method', 'CASH',
    'amount_paid', 1400,
    'items', jsonb_build_array(jsonb_build_object(
      'rice_product_id', v_pid,
      'selling_method', 'PER_SACK',
      'sack_size_type', '25KG',
      'sack_size_kg', 25,
      'quantity_sacks', 1,
      'price_per_sack', 1400))));
  select coalesce(max(full_sacks), 0) into v_stock from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_stock, 7, 'SEC: secretary can sell (10 - 2 - 1 = 7 sacks)');

  -- Denies: inventory module not readable
  select count(*) into v_n from public.rice_products;
  perform public.test_num_eq(v_n, 0, 'SEC: cannot read the product master');
  select count(*) into v_n from public.inventory_balances;
  perform public.test_num_eq(v_n, 0, 'SEC: cannot read inventory balances');
  select count(*) into v_n from public.inventory_movements;
  perform public.test_num_eq(v_n, 0, 'SEC: cannot read inventory movements');

  -- Allowed: sales/deliveries/credits rows (module access)
  select count(*) into v_n from public.sales;
  perform public.test_num_eq(v_n, 2, 'SEC: can read sales');
  select count(*) into v_n from public.deliveries;
  perform public.test_num_eq(v_n, 1, 'SEC: can read deliveries');

  -- Denies: admin surfaces
  select count(*) into v_n from public.audit_logs;
  perform public.test_num_eq(v_n, 0, 'SEC: cannot read the audit log');
  select count(*) into v_n from public.profiles;
  perform public.test_num_eq(v_n, 1, 'SEC: sees only their own profile row');

  -- Denies: direct inventory writes are impossible (no write policy)
  update public.inventory_balances set full_sacks = 999 where full_sacks > 0;
  select coalesce(max(full_sacks), 0) into v_full from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_full, 7, 'SEC: direct UPDATE on inventory_balances silently affects 0 rows');

  perform public.test_expect_error(
    format('insert into public.inventory_balances (rice_product_id, sack_size_type, sack_size_kg)
            values (%L, ''OTHER'', 30)', v_pid),
    'row-level security', 'SEC: direct INSERT into inventory_balances is blocked by RLS');

  -- Denies: privileged RPCs
  perform public.test_expect_error(
    format('select public.adjust_inventory(%L::jsonb)', jsonb_build_object(
      'rice_product_id', v_pid, 'sack_size_type', '25KG', 'sack_size_kg', 25,
      'new_full_sacks', 99, 'reason', 'sneaky')::text),
    'FORBIDDEN', 'SEC: adjust_inventory requires inventory.adjust');

  -- Denies: settings write (no policy for this role -> 0 rows)
  update public.system_settings set setting_value = '{"hacked": true}'::jsonb
   where setting_key = 'company';
  get diagnostics v_n = row_count;
  perform public.test_num_eq(v_n, 0, 'SEC: cannot update system_settings');

  -- Denies: profile edits (no users.update) -> own row untouched
  update public.profiles set full_name = 'Hacked Name'
   where auth_user_id = '00000000-0000-0000-0000-000000000004';
  get diagnostics v_n = row_count;
  perform public.test_num_eq(v_n, 0, 'SEC: cannot update own profile');
  select full_name into v_name from public.profiles
   where auth_user_id = '00000000-0000-0000-0000-000000000004';
  perform public.test_text_eq(v_name, 'Test Secretary', 'SEC: own profile unchanged');

  select public.has_permission('sales.create') into v_ok;
  perform public.test_assert(v_ok, 'SEC: has sales.create');
  select public.has_permission('inventory.adjust') into v_ok;
  perform public.test_assert(not v_ok, 'SEC: does not have inventory.adjust');
end;
$$;

-- ---------------------------------------------------------------------------
-- OTHER_STAFF: no permissions by default
-- ---------------------------------------------------------------------------
reset role;
select public.test_login('staff@rims.test.local');
set local role authenticated;

do $$
declare
  v_pid uuid := public.test_product_id('Princess Bea');
  v_n integer;
  v_ok boolean;
begin
  perform public.test_expect_error(
    format('select public.process_sale(%L::jsonb)', jsonb_build_object(
      'payment_method', 'CASH',
      'amount_paid', 1400,
      'items', jsonb_build_array(jsonb_build_object(
        'rice_product_id', v_pid, 'selling_method', 'PER_SACK',
        'sack_size_type', '25KG', 'sack_size_kg', 25,
        'quantity_sacks', 1, 'price_per_sack', 1400)))::text),
    'FORBIDDEN', 'STAFF: cannot create sales without permission');

  perform public.test_expect_error(
    'select public.get_product_catalog()',
    'FORBIDDEN', 'STAFF: cannot read the product catalog');

  select count(*) into v_n from public.sales;
  perform public.test_num_eq(v_n, 0, 'STAFF: sees no sales');
  select count(*) into v_n from public.rice_products;
  perform public.test_num_eq(v_n, 0, 'STAFF: sees no products');
  select count(*) into v_n from public.inventory_balances;
  perform public.test_num_eq(v_n, 0, 'STAFF: sees no inventory');

  select public.has_permission('sales.create') into v_ok;
  perform public.test_assert(not v_ok, 'STAFF: has no sales.create');
end;
$$;

-- ---------------------------------------------------------------------------
-- ANONYMOUS: no access to business data at all
-- ---------------------------------------------------------------------------
reset role;
select public.test_login_anon();
set local role anon;

do $$
declare
  v_n integer;
begin
  select count(*) into v_n from public.sales;
  perform public.test_num_eq(v_n, 0, 'ANON: sees no sales');
  select count(*) into v_n from public.rice_products;
  perform public.test_num_eq(v_n, 0, 'ANON: sees no products');
  select count(*) into v_n from public.inventory_balances;
  perform public.test_num_eq(v_n, 0, 'ANON: sees no inventory');
  select count(*) into v_n from public.profiles;
  perform public.test_num_eq(v_n, 0, 'ANON: sees no profiles');

  perform public.test_expect_error(
    'select public.process_sale(''{"items":[]}''::jsonb)',
    'NOT_AUTHENTICATED', 'ANON: cannot call process_sale');
  perform public.test_expect_error(
    'select public.get_product_catalog()',
    'NOT_AUTHENTICATED', 'ANON: cannot call get_product_catalog');
end;
$$;

-- ---------------------------------------------------------------------------
-- SUPER_ADMIN: profile privilege-escalation guard + audit visibility
-- ---------------------------------------------------------------------------
reset role;
select public.test_login('admin@rims.test.local');
set local role authenticated;

do $$
declare
  v_n integer;
  v_name text;
begin
  -- Nobody may deactivate their own account
  perform public.test_expect_error(
    'update public.profiles set is_active = false
      where auth_user_id = ''00000000-0000-0000-0000-000000000001''',
    'cannot deactivate your own account', 'ADMIN: self-deactivation is blocked');

  -- A Super Admin may change someone else''s role
  update public.profiles set role_id = (select id from public.roles where name = 'MANAGER')
   where auth_user_id = '00000000-0000-0000-0000-000000000004';
  select r.name into v_name from public.profiles p
    join public.roles r on r.id = p.role_id
   where p.auth_user_id = '00000000-0000-0000-0000-000000000004';
  perform public.test_text_eq(v_name, 'MANAGER', 'ADMIN: can change another user''s role');

  -- Audit log is readable by administrators
  select count(*) into v_n from public.audit_logs where action = 'SALE_CREATED';
  perform public.test_num_eq(v_n, 2, 'ADMIN: reads this run''s audit entries');
  select count(*) into v_n from public.profiles
  where auth_user_id::text like '00000000-0000-0000-0000-00000000000%';
  perform public.test_num_eq(v_n, 5, 'ADMIN: sees all five test profiles');
end;
$$;
