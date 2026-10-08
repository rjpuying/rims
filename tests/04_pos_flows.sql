-- POS rules: PER_KG sack-opening, credit sales, stock adjustment.

select public.test_login('owner@rims.test.local');
set local role authenticated;

do $$
declare
  v_pid uuid := public.test_product_id('Princess Bea');
  v_del jsonb;
  v_sale jsonb;
  v_adj jsonb;
  v_full numeric;
  v_loose numeric;
  v_n integer;
  v_credit_id uuid;
  v_paid numeric;
  v_balance numeric;
begin
  select coalesce(max(full_sacks), 0) into v_full from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_full, 0, 'T0: Princess Bea 25kg starts at 0 sacks');

  -- Setup: 10 x 25kg
  v_del := public.receive_delivery(jsonb_build_object(
    'supplier_name', 'Test Supplier Inc.',
    'amount_paid', 13000,
    'items', jsonb_build_array(jsonb_build_object(
      'rice_product_id', v_pid,
      'sack_size_type', '25KG',
      'sack_size_kg', 25,
      'quantity_sacks', 10,
      'price_per_sack', 1300,
      'batch_number', 'BATCH-POS'))));

  -- PER_KG: sell 10 KG from an empty loose pile -> opens 1 sack, 15 KG loose left
  v_sale := public.process_sale(jsonb_build_object(
    'payment_method', 'CASH',
    'amount_paid', 600,
    'items', jsonb_build_array(jsonb_build_object(
      'rice_product_id', v_pid,
      'selling_method', 'PER_KG',
      'sack_size_type', '25KG',
      'sack_size_kg', 25,
      'quantity_kg', 10,
      'price_per_kg', 60))));

  select full_sacks, loose_kg into v_full, v_loose from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_full, 9, 'KG1: 1 sack opened -> 9 whole sacks');
  perform public.test_num_eq(v_loose, 15, 'KG1: 15 KG loose remaining');
  perform public.test_num_eq((v_sale->>'total_amount')::numeric, 600, 'KG1: 10 KG x 60 = 600');

  -- PER_KG: sell 20 KG -> loose 15 KG is not enough, opens 1 more sack
  v_sale := public.process_sale(jsonb_build_object(
    'payment_method', 'GCASH',
    'amount_paid', 1200,
    'items', jsonb_build_array(jsonb_build_object(
      'rice_product_id', v_pid,
      'selling_method', 'PER_KG',
      'sack_size_type', '25KG',
      'sack_size_kg', 25,
      'quantity_kg', 20,
      'price_per_kg', 60))));

  select full_sacks, loose_kg into v_full, v_loose from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_full, 8, 'KG2: another sack opened -> 8 whole sacks');
  perform public.test_num_eq(v_loose, 20, 'KG2: 15 + 25 - 20 = 20 KG loose');

  select count(*) into v_n from public.inventory_movements
   where movement_type = 'SALE' and loose_kg_change > 0;
  perform public.test_num_eq(v_n, 2, 'KG: both KG sales opened sacks (loose movement recorded)');

  -- Guards
  perform public.test_expect_error(
    format('select public.process_sale(%L::jsonb)', jsonb_build_object(
      'payment_method', 'CASH',
      'amount_paid', 60000,
      'items', jsonb_build_array(jsonb_build_object(
        'rice_product_id', v_pid, 'selling_method', 'PER_KG',
        'sack_size_type', '25KG', 'sack_size_kg', 25,
        'quantity_kg', 1000, 'price_per_kg', 60)))::text),
    'INSUFFICIENT_INVENTORY', 'KG: selling 1,000 KG with 220 KG in stock is rejected');

  perform public.test_expect_error(
    format('select public.process_sale(%L::jsonb)', jsonb_build_object(
      'payment_method', 'CASH',
      'amount_paid', 0,
      'items', jsonb_build_array(jsonb_build_object(
        'rice_product_id', v_pid, 'selling_method', 'PER_SACK',
        'sack_size_type', '25KG', 'sack_size_kg', 25,
        'quantity_sacks', 0, 'price_per_sack', 1400)))::text),
    'Quantity must be greater than zero', 'KG: zero quantity is rejected');

  -- Credit sale: 3 sacks, partial payment, customer required
  perform public.test_expect_error(
    format('select public.process_sale(%L::jsonb)', jsonb_build_object(
      'payment_method', 'CREDIT',
      'amount_paid', 1000,
      'items', jsonb_build_array(jsonb_build_object(
        'rice_product_id', v_pid, 'selling_method', 'PER_SACK',
        'sack_size_type', '25KG', 'sack_size_kg', 25,
        'quantity_sacks', 3, 'price_per_sack', 1400)))::text),
    'Customer name is required', 'CREDIT: credit sale without customer name is rejected');

  v_sale := public.process_sale(jsonb_build_object(
    'customer_name', 'Juan Cruz',
    'payment_method', 'CREDIT',
    'amount_paid', 1000,
    'items', jsonb_build_array(jsonb_build_object(
      'rice_product_id', v_pid,
      'selling_method', 'PER_SACK',
      'sack_size_type', '25KG',
      'sack_size_kg', 25,
      'quantity_sacks', 3,
      'price_per_sack', 1400))));

  perform public.test_num_eq((v_sale->>'total_amount')::numeric, 4200, 'CREDIT: total = 3 x 1,400 = 4,200');
  perform public.test_num_eq((v_sale->>'balance')::numeric, 3200, 'CREDIT: balance = 3,200');
  perform public.test_text_eq(v_sale->>'payment_status', 'PARTIALLY_PAID', 'CREDIT: sale is PARTIALLY_PAID');

  v_credit_id := (v_sale->>'credit_id')::uuid;
  select amount_paid, balance into v_paid, v_balance from public.credits where id = v_credit_id;
  perform public.test_num_eq(v_paid, 1000, 'CREDIT: credit records 1,000 paid');
  perform public.test_num_eq(v_balance, 3200, 'CREDIT: credit balance = 3,200');

  select full_sacks into v_full from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_full, 5, 'CREDIT: stock 8 -> 5 sacks');

  perform public.test_expect_error(
    format('select public.process_sale(%L::jsonb)', jsonb_build_object(
      'customer_name', 'Too Much',
      'payment_method', 'CREDIT',
      'amount_paid', 99999,
      'items', jsonb_build_array(jsonb_build_object(
        'rice_product_id', v_pid, 'selling_method', 'PER_SACK',
        'sack_size_type', '25KG', 'sack_size_kg', 25,
        'quantity_sacks', 1, 'price_per_sack', 1400)))::text),
    'cannot exceed the sale total', 'CREDIT: paying more than the total is rejected');

  -- Stock adjustment (physical count)
  v_adj := public.adjust_inventory(jsonb_build_object(
    'rice_product_id', v_pid,
    'sack_size_type', '25KG',
    'sack_size_kg', 25,
    'new_full_sacks', 6,
    'reason', 'Found one sack in the back'));
  select full_sacks into v_full from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_full, 6, 'ADJUST: count corrected 5 -> 6 sacks');
  perform public.test_num_eq((v_adj->>'delta_sacks')::numeric, 1, 'ADJUST: delta = +1 sack');

  perform public.test_expect_error(
    format('select public.adjust_inventory(%L::jsonb)', jsonb_build_object(
      'rice_product_id', v_pid, 'sack_size_type', '25KG', 'sack_size_kg', 25,
      'new_full_sacks', 6)::text),
    'reason is required', 'ADJUST: adjustment without a reason is rejected');

  perform public.test_expect_error(
    format('select public.adjust_inventory(%L::jsonb)', jsonb_build_object(
      'rice_product_id', v_pid, 'sack_size_type', '25KG', 'sack_size_kg', 25,
      'new_full_sacks', 6, 'reason', 'Nothing changed')::text),
    'would not change', 'ADJUST: no-op adjustment is rejected');

  perform public.test_expect_error(
    format('select public.adjust_inventory(%L::jsonb)', jsonb_build_object(
      'rice_product_id', v_pid, 'sack_size_type', '25KG', 'sack_size_kg', 25,
      'new_full_sacks', -5, 'reason', 'Negative count')::text),
    'zero or greater', 'ADJUST: negative count is rejected');

  v_adj := public.adjust_inventory(jsonb_build_object(
    'rice_product_id', v_pid,
    'sack_size_type', '25KG',
    'sack_size_kg', 25,
    'new_full_sacks', 4,
    'reason', 'Physical count'));
  select full_sacks into v_full from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_full, 4, 'ADJUST: count corrected 6 -> 4 sacks');

  select count(*) into v_n from public.inventory_movements where movement_type = 'STOCK_ADJUSTMENT';
  perform public.test_num_eq(v_n, 2, 'ADJUST: two STOCK_ADJUSTMENT movements recorded');
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
  perform public.test_num_eq(v_n, 3, 'AUDIT: SALE_CREATED logged three times');
  select count(*) into v_n from public.audit_logs where action = 'INVENTORY_ADJUSTED';
  perform public.test_num_eq(v_n, 2, 'AUDIT: INVENTORY_ADJUSTED logged twice');
end;
$$;
