-- §74 Tests 1–3: delivery in, sale out, insufficient inventory rejected.
-- Precondition: this database has no committed stock (asserted below).

select public.test_login('owner@rims.test.local');
set local role authenticated;

do $$
declare
  v_pid uuid := public.test_product_id('Princess Bea');
  v_stock0 numeric;
  v_del jsonb;
  v_sale jsonb;
  v_stock numeric;
  v_n integer;
begin
  select coalesce(max(full_sacks), 0) into v_stock0
  from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_stock0, 0, 'T0: Princess Bea 25kg starts at 0 sacks');

  -- Test 1 — Receive 100 x 25kg Princess Bea
  v_del := public.receive_delivery(jsonb_build_object(
    'supplier_name', 'Test Supplier Inc.',
    'delivery_date', '2026-10-08T08:00:00+08:00',
    'amount_paid', 130000,
    'items', jsonb_build_array(jsonb_build_object(
      'rice_product_id', v_pid,
      'sack_size_type', '25KG',
      'sack_size_kg', 25,
      'quantity_sacks', 100,
      'price_per_sack', 1300,
      'batch_number', 'BATCH-T1'))));

  select coalesce(max(full_sacks), 0) into v_stock from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_stock, 100, 'T1: stock = 100 sacks after delivery');
  perform public.test_num_eq((v_del->>'total_amount')::numeric, 130000, 'T1: delivery total = 100 x 1,300');
  perform public.test_text_eq(v_del->>'payment_status', 'PAID', 'T1: fully paid delivery');
  perform public.test_assert((v_del->>'transaction_number') ~ '^DEL-[0-9]{8}-[0-9]{4}$',
    'T1: delivery number format DEL-YYYYMMDD-NNNN');

  select count(*) into v_n from public.inventory_movements
   where reference_type = 'DELIVERY' and movement_type = 'DELIVERY_RECEIVED'
     and full_sacks_change = 100;
  perform public.test_num_eq(v_n, 1, 'T1: one +100 DELIVERY_RECEIVED movement recorded');

  -- Test 2 — Sell 20 x 25kg Princess Bea
  v_sale := public.process_sale(jsonb_build_object(
    'payment_method', 'CASH',
    'amount_paid', 28000,
    'items', jsonb_build_array(jsonb_build_object(
      'rice_product_id', v_pid,
      'selling_method', 'PER_SACK',
      'sack_size_type', '25KG',
      'sack_size_kg', 25,
      'quantity_sacks', 20,
      'price_per_sack', 1400))));

  select coalesce(max(full_sacks), 0) into v_stock from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_stock, 80, 'T2: stock = 100 -> 80 sacks after sale');
  perform public.test_num_eq((v_sale->>'total_amount')::numeric, 28000, 'T2: sale total = 20 x 1,400');
  perform public.test_text_eq(v_sale->>'payment_status', 'PAID', 'T2: cash sale is PAID');
  perform public.test_assert((v_sale->>'transaction_number') ~ '^SAL-[0-9]{8}-[0-9]{4}$',
    'T2: sale number format SAL-YYYYMMDD-NNNN');
  perform public.test_assert((v_sale->>'credit_id')::uuid is null, 'T2: no credit for a fully paid sale');

  -- Test 3 — Selling 100 sacks when only 80 are available must be rejected
  perform public.test_expect_error(
    format('select public.process_sale(%L::jsonb)', jsonb_build_object(
      'customer_name', 'Walk-in',
      'payment_method', 'CASH',
      'amount_paid', 140000,
      'items', jsonb_build_array(jsonb_build_object(
        'rice_product_id', v_pid,
        'selling_method', 'PER_SACK',
        'sack_size_type', '25KG',
        'sack_size_kg', 25,
        'quantity_sacks', 100,
        'price_per_sack', 1400)))::text),
    'INSUFFICIENT_INVENTORY', 'T3: selling 100 sacks with only 80 in stock is rejected');

  select coalesce(max(full_sacks), 0) into v_stock from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_stock, 80, 'T3: inventory unchanged after rejected sale');
  select count(*) into v_n from public.sales;
  perform public.test_num_eq(v_n, 1, 'T3: no extra sale row was created');
end;
$$;

-- §76 — audit records for this file
reset role;
select public.test_login('admin@rims.test.local');
set local role authenticated;

do $$
declare
  v_n integer;
begin
  select count(*) into v_n from public.audit_logs where action = 'DELIVERY_RECEIVED';
  perform public.test_num_eq(v_n, 1, 'AUDIT: DELIVERY_RECEIVED logged');
  select count(*) into v_n from public.audit_logs where action = 'SALE_CREATED';
  perform public.test_num_eq(v_n, 1, 'AUDIT: SALE_CREATED logged');
end;
$$;
