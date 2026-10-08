-- §74 Test 7 (rice rebagging), §75 (palay receive + conversion), rejects.

select public.test_login('owner@rims.test.local');
set local role authenticated;

do $$
declare
  v_pb50 uuid := public.test_product_id('Princess Bea');
  v_hasmin uuid := public.test_product_id('Hasmin Blue');
  v_dinorado uuid := public.test_product_id('Dinorado');
  v_del jsonb;
  v_palay jsonb;
  v_reb jsonb;
  v_conv jsonb;
  v_stock numeric;
  v_kg numeric;
  v_n integer;
begin
  select coalesce(max(full_sacks), 0) into v_stock from public.test_stock('Princess Bea', '50KG', 50);
  perform public.test_num_eq(v_stock, 0, 'T0: Princess Bea 50kg starts at 0 sacks');
  perform public.test_num_eq(public.test_palay_kg('Dinorado'), 0, 'T0: Dinorado palay starts at 0 KG');

  -- Setup: 10 x 50kg Princess Bea in stock (Test 7 starting state)
  v_del := public.receive_delivery(jsonb_build_object(
    'supplier_name', 'Test Supplier Inc.',
    'amount_paid', 25000,
    'items', jsonb_build_array(jsonb_build_object(
      'rice_product_id', v_pb50,
      'sack_size_type', '50KG',
      'sack_size_kg', 50,
      'quantity_sacks', 10,
      'price_per_sack', 2500,
      'batch_number', 'BATCH-T7'))));
  select coalesce(max(full_sacks), 0) into v_stock from public.test_stock('Princess Bea', '50KG', 50);
  perform public.test_num_eq(v_stock, 10, 'SETUP: 10 x 50kg sacks in stock');

  -- Setup: 1,000 KG Dinorado palay
  v_palay := public.receive_palay(jsonb_build_object(
    'farmer_name', 'Juan Dela Cruz',
    'amount_paid', 30000,
    'items', jsonb_build_array(jsonb_build_object(
      'rice_product_id', v_dinorado,
      'variety', 'Dinorado',
      'quantity_kg', 1000,
      'price_per_kg', 30))));
  perform public.test_num_eq(public.test_palay_kg('Dinorado'), 1000, 'SETUP: palay inventory = 1,000 KG');
  perform public.test_text_eq(v_palay->>'payment_status', 'PAID', 'SETUP: palay receipt fully paid');
  perform public.test_assert((v_palay->>'transaction_number') ~ '^PAL-[0-9]{8}-[0-9]{4}$',
    'SETUP: palay number format PAL-YYYYMMDD-NNNN');

  -- Test 7 — 10 x 50kg Princess Bea -> 20 x 25kg Hasmin (500 KG both sides)
  v_reb := public.process_rice_rebagging(jsonb_build_object(
    'source', jsonb_build_object(
      'rice_product_id', v_pb50,
      'sack_size_type', '50KG',
      'sack_size_kg', 50,
      'quantity_sacks', 10),
    'destination', jsonb_build_object(
      'rice_product_id', v_hasmin,
      'sack_size_type', '25KG',
      'sack_size_kg', 25),
    'notes', 'Rebag for retail'));

  perform public.test_num_eq((v_reb->>'source_kg')::numeric, 500, 'T7: source = 10 x 50 = 500 KG');
  perform public.test_num_eq((v_reb->>'destination_sacks')::numeric, 20, 'T7: destination = 20 sacks of 25kg');
  perform public.test_num_eq((v_reb->>'loss_kg')::numeric, 0, 'T7: no loss');
  perform public.test_assert((v_reb->>'transaction_number') ~ '^REB-[0-9]{8}-[0-9]{4}$',
    'T7: rebagging number format REB-YYYYMMDD-NNNN');

  select coalesce(max(full_sacks), 0) into v_stock from public.test_stock('Princess Bea', '50KG', 50);
  perform public.test_num_eq(v_stock, 0, 'T7: Princess Bea 50kg = 0 after rebagging');
  select coalesce(max(full_sacks), 0) into v_stock from public.test_stock('Hasmin Blue', '25KG', 25);
  perform public.test_num_eq(v_stock, 20, 'T7: Hasmin Blue 25kg = +20 sacks');

  -- Rebagging guards
  perform public.test_expect_error(
    format('select public.process_rice_rebagging(%L::jsonb)', jsonb_build_object(
      'source', jsonb_build_object('rice_product_id', v_pb50, 'sack_size_type', '50KG', 'sack_size_kg', 50, 'quantity_sacks', 5),
      'destination', jsonb_build_object('rice_product_id', v_hasmin, 'sack_size_type', '25KG', 'sack_size_kg', 25))::text),
    'INSUFFICIENT_INVENTORY', 'T7: rebagging more than in stock is rejected');

  perform public.test_expect_error(
    format('select public.process_rice_rebagging(%L::jsonb)', jsonb_build_object(
      'source', jsonb_build_object('rice_product_id', v_hasmin, 'sack_size_type', '25KG', 'sack_size_kg', 25, 'quantity_sacks', 1),
      'destination', jsonb_build_object('rice_product_id', v_hasmin, 'sack_size_type', '25KG', 'sack_size_kg', 25))::text),
    'Source and destination must be different', 'T7: identical source/destination is rejected');

  -- §75 — Palay conversion: 1,000 KG -> 700 KG (28 x 25kg), yield 70%, loss 300 KG
  perform public.test_expect_error(
    format('select public.process_palay_to_rice(%L::jsonb)', jsonb_build_object(
      'source_rice_product_id', v_dinorado,
      'variety', 'Dinorado',
      'palay_input_kg', 500,
      'destination_rice_product_id', v_dinorado,
      'destination_sack_size_type', '25KG',
      'destination_sack_size_kg', 25,
      'rice_output_sacks', 25)::text),
    'cannot exceed palay input', 'PALAY: output heavier than input is rejected');

  v_conv := public.process_palay_to_rice(jsonb_build_object(
    'source_rice_product_id', v_dinorado,
    'variety', 'Dinorado',
    'palay_input_kg', 1000,
    'destination_rice_product_id', v_dinorado,
    'destination_sack_size_type', '25KG',
    'destination_sack_size_kg', 25,
    'rice_output_sacks', 28,
    'loss_reason', 'Milling loss'));

  perform public.test_num_eq(public.test_palay_kg('Dinorado'), 0, 'PALAY: 1,000 -> 0 KG');
  select coalesce(max(full_sacks), 0) into v_stock from public.test_stock('Dinorado', '25KG', 25);
  perform public.test_num_eq(v_stock, 28, 'PALAY: rice inventory +28 sacks');
  perform public.test_num_eq((v_conv->>'yield_percentage')::numeric, 70, 'PALAY: yield = 70%');
  perform public.test_num_eq((v_conv->>'loss_kg')::numeric, 300, 'PALAY: loss = 300 KG');
  perform public.test_assert((v_conv->>'transaction_number') ~ '^CON-[0-9]{8}-[0-9]{4}$',
    'PALAY: conversion number format CON-YYYYMMDD-NNNN');

  perform public.test_expect_error(
    format('select public.process_palay_to_rice(%L::jsonb)', jsonb_build_object(
      'source_rice_product_id', v_dinorado,
      'variety', 'Dinorado',
      'palay_input_kg', 100,
      'destination_rice_product_id', v_dinorado,
      'destination_sack_size_type', '25KG',
      'destination_sack_size_kg', 25,
      'rice_output_sacks', 4)::text),
    'INSUFFICIENT_INVENTORY', 'PALAY: converting with empty palay stock is rejected');

  -- Reject flow: 5 of the Hasmin sacks are damaged
  v_reb := public.record_reject(jsonb_build_object(
    'rice_product_id', v_hasmin,
    'sack_size_type', '25KG',
    'sack_size_kg', 25,
    'quantity_sacks', 5,
    'reason', 'Water damage'));

  select coalesce(max(full_sacks), 0), coalesce(max(rejected_sacks), 0)
    into v_stock, v_kg from public.test_stock('Hasmin Blue', '25KG', 25);
  perform public.test_num_eq(v_stock, 15, 'REJECT: available 20 -> 15 sacks');
  perform public.test_num_eq(v_kg, 5, 'REJECT: rejected stock = 5 sacks');

  perform public.test_expect_error(
    format('select public.record_reject(%L::jsonb)', jsonb_build_object(
      'rice_product_id', v_hasmin,
      'sack_size_type', '25KG',
      'sack_size_kg', 25,
      'quantity_sacks', 100,
      'reason', 'Too much')::text),
    'INSUFFICIENT_INVENTORY', 'REJECT: rejecting more than available is rejected');
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
  select count(*) into v_n from public.audit_logs where action = 'PALAY_RECEIVED';
  perform public.test_num_eq(v_n, 1, 'AUDIT: PALAY_RECEIVED logged');
  select count(*) into v_n from public.audit_logs where action = 'RICE_REBAGGING_PROCESSED';
  perform public.test_num_eq(v_n, 1, 'AUDIT: RICE_REBAGGING_PROCESSED logged');
  select count(*) into v_n from public.audit_logs where action = 'PALAY_CONVERSION_PROCESSED';
  perform public.test_num_eq(v_n, 1, 'AUDIT: PALAY_CONVERSION_PROCESSED logged');
  select count(*) into v_n from public.audit_logs where action = 'INVENTORY_REJECTED';
  perform public.test_num_eq(v_n, 1, 'AUDIT: INVENTORY_REJECTED logged');
end;
$$;
