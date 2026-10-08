-- §74 Tests 4–6: reseller transfer, credit creation, credit payment.

select public.test_login('owner@rims.test.local');
set local role authenticated;

do $$
declare
  v_pid uuid := public.test_product_id('Princess Bea');
  v_stock0 numeric;
  v_del jsonb;
  v_trf jsonb;
  v_stock numeric;
  v_n integer;
  v_credit_id uuid;
  v_paid numeric;
  v_balance numeric;
  v_status text;
  v_original numeric;
begin
  select coalesce(max(full_sacks), 0) into v_stock0
  from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_stock0, 0, 'T0: Princess Bea 25kg starts at 0 sacks');

  -- Stock in: 80 sacks
  v_del := public.receive_delivery(jsonb_build_object(
    'supplier_name', 'Test Supplier Inc.',
    'amount_paid', 104000,
    'items', jsonb_build_array(jsonb_build_object(
      'rice_product_id', v_pid,
      'sack_size_type', '25KG',
      'sack_size_kg', 25,
      'quantity_sacks', 80,
      'price_per_sack', 1300,
      'batch_number', 'BATCH-T4'))));
  select coalesce(max(full_sacks), 0) into v_stock from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_stock, 80, 'SETUP: 80 sacks in stock');

  -- Test 4 — Transfer 20 x 25kg
  v_trf := public.process_reseller_transfer(jsonb_build_object(
    'reseller_name', 'Test Reseller',
    'payment_method', 'CASH',
    'amount_paid', 10000,
    'items', jsonb_build_array(jsonb_build_object(
      'rice_product_id', v_pid,
      'sack_size_type', '25KG',
      'sack_size_kg', 25,
      'quantity_sacks', 20,
      'price_per_sack', 1350))));

  select coalesce(max(full_sacks), 0) into v_stock from public.test_stock('Princess Bea', '25KG', 25);
  perform public.test_num_eq(v_stock, 60, 'T4: stock = 80 -> 60 sacks after transfer');
  perform public.test_assert((v_trf->>'transaction_number') ~ '^TRF-[0-9]{8}-[0-9]{4}$',
    'T4: transfer number format TRF-YYYYMMDD-NNNN');

  -- Test 5 — Total 27,000 / paid 10,000 / balance 17,000 + credit created
  perform public.test_num_eq((v_trf->>'total_amount')::numeric, 27000, 'T5: transfer total = 20 x 1,350 = 27,000');
  perform public.test_num_eq((v_trf->>'amount_paid')::numeric, 10000, 'T5: down payment = 10,000');
  perform public.test_num_eq((v_trf->>'balance')::numeric, 17000, 'T5: balance = 17,000');
  perform public.test_text_eq(v_trf->>'payment_status', 'PARTIALLY_PAID', 'T5: transfer is PARTIALLY_PAID');
  perform public.test_assert((v_trf->>'credit_id')::uuid is not null, 'T5: credit created for unpaid transfer');

  v_credit_id := (v_trf->>'credit_id')::uuid;
  select amount_paid, balance, status::text into v_paid, v_balance, v_status
    from public.credits where id = v_credit_id;
  perform public.test_num_eq(v_paid, 10000, 'T5: credit records the 10,000 already paid');
  perform public.test_num_eq(v_balance, 17000, 'T5: credit balance = 17,000');

  -- Test 6 — Pay 7,000
  perform public.record_credit_payment(jsonb_build_object(
    'credit_id', v_credit_id,
    'amount', 7000,
    'payment_method', 'GCASH',
    'notes', 'Partial payment'));

  select amount_paid, balance into v_paid, v_balance
    from public.credits where id = v_credit_id;
  perform public.test_num_eq(v_paid, 17000, 'T6: paid = 10,000 + 7,000 = 17,000');
  perform public.test_num_eq(v_balance, 10000, 'T6: balance = 10,000');

  select original_amount into v_original from public.credits where id = v_credit_id;
  perform public.test_num_eq(v_original, 27000, 'T6: original amount = 27,000');

  -- Transfer row stays in sync with its credit payments
  select amount_paid, balance, payment_status::text into v_paid, v_balance, v_status
    from public.reseller_transfers where id = (v_trf->>'id')::uuid;
  perform public.test_num_eq(v_paid, 17000, 'T6: transfer amount_paid synced to 17,000');
  perform public.test_num_eq(v_balance, 10000, 'T6: transfer balance synced to 10,000');

  -- Overpayment must be blocked
  perform public.test_expect_error(
    format('select public.record_credit_payment(%L::jsonb)', jsonb_build_object(
      'credit_id', v_credit_id, 'amount', 20000, 'payment_method', 'CASH')::text),
    'exceeds the outstanding balance', 'T6: paying more than the balance is rejected');

  perform public.test_expect_error(
    format('select public.record_credit_payment(%L::jsonb)', jsonb_build_object(
      'credit_id', v_credit_id, 'amount', -500, 'payment_method', 'CASH')::text),
    'greater than zero', 'T6: negative payment is rejected');

  -- Pay the remaining 10,000
  v_trf := public.record_credit_payment(jsonb_build_object(
    'credit_id', v_credit_id,
    'amount', 10000,
    'payment_method', 'CASH'));
  perform public.test_text_eq(v_trf->>'status', 'PAID', 'T6: credit becomes PAID');
  perform public.test_assert((v_trf->>'fully_paid')::boolean, 'T6: fully_paid flag set');

  select amount_paid, balance, payment_status::text into v_paid, v_balance, v_status
    from public.reseller_transfers
    where id = (select source_transaction_id from public.credits where id = v_credit_id);
  perform public.test_num_eq(v_paid, 27000, 'T6: transfer fully paid = 27,000');
  perform public.test_num_eq(v_balance, 0, 'T6: transfer balance = 0');

  select count(*) into v_n from public.credit_payments where credit_id = v_credit_id;
  perform public.test_num_eq(v_n, 2, 'T6: two credit payments recorded');
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
  select count(*) into v_n from public.audit_logs where action = 'RESELLER_TRANSFER_CREATED';
  perform public.test_num_eq(v_n, 1, 'AUDIT: RESELLER_TRANSFER_CREATED logged');
  select count(*) into v_n from public.audit_logs where action = 'CREDIT_PAYMENT_RECORDED';
  perform public.test_num_eq(v_n, 2, 'AUDIT: CREDIT_PAYMENT_RECORDED logged twice');
end;
$$;
