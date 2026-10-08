-- 017 RPC part 3: process_rice_rebagging(), process_palay_to_rice(), record_credit_payment()

-- ---------------------------------------------------------------------------
-- process_rice_rebagging(): RICE → RICE, always calculated in KG
-- ---------------------------------------------------------------------------

create or replace function public.process_rice_rebagging(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := public.require_permission('rebagging.create');
  v_source jsonb := p_payload -> 'source';
  v_dest jsonb := p_payload -> 'destination';
  v_src_product_id uuid;
  v_dst_product_id uuid;
  v_src_type public.sack_size_type;
  v_src_kg numeric;
  v_dst_type public.sack_size_type;
  v_dst_kg numeric;
  v_src_sacks numeric;
  v_loss numeric;
  v_loss_reason text;
  v_notes text := public.j_text(p_payload, 'notes');
  v_source_kg numeric;
  v_dest_kg numeric;
  v_dest_sacks numeric;
  v_dest_loose numeric;
  v_src_bal public.inventory_balances;
  v_dst_bal public.inventory_balances;
  v_src_product public.rice_products;
  v_dst_product public.rice_products;
  v_src_before numeric;
  v_dst_before_sacks numeric;
  v_dst_before_loose numeric;
  v_number text;
  v_tx_id uuid;
begin
  if v_source is null or jsonb_typeof(v_source) <> 'object' then
    raise exception 'VALIDATION: Source rice is required.';
  end if;
  if v_dest is null or jsonb_typeof(v_dest) <> 'object' then
    raise exception 'VALIDATION: Destination rice is required.';
  end if;

  v_src_product_id := public.j_uuid(v_source, 'rice_product_id');
  v_dst_product_id := public.j_uuid(v_dest, 'rice_product_id');
  v_src_type := public.j_text(v_source, 'sack_size_type', null, true)::public.sack_size_type;
  v_src_kg := public.j_num(v_source, 'sack_size_kg', null, true);
  v_dst_type := public.j_text(v_dest, 'sack_size_type', null, true)::public.sack_size_type;
  v_dst_kg := public.j_num(v_dest, 'sack_size_kg', null, true);
  v_src_sacks := public.j_num(v_source, 'quantity_sacks', null, true);
  v_loss := coalesce(public.j_num(p_payload, 'loss_kg', 0), 0);
  v_loss_reason := public.j_text(p_payload, 'loss_reason');

  if v_src_sacks is null or v_src_sacks <= 0 then
    raise exception 'VALIDATION: Source quantity must be greater than zero.';
  end if;
  if v_loss < 0 then
    raise exception 'VALIDATION: Loss cannot be negative.';
  end if;
  if v_src_product_id = v_dst_product_id and v_src_type = v_dst_type then
    raise exception 'VALIDATION: Source and destination must be different (product or sack size).';
  end if;

  select * into v_src_product from public.rice_products where id = v_src_product_id and is_active;
  if not found then
    raise exception 'VALIDATION: Source rice product was not found or is inactive.';
  end if;
  select * into v_dst_product from public.rice_products where id = v_dst_product_id and is_active;
  if not found then
    raise exception 'VALIDATION: Destination rice product was not found or is inactive.';
  end if;

  -- Lock source stock
  v_src_bal := public.lock_balance(v_src_product_id, v_src_type, v_src_kg, false);
  v_src_before := v_src_bal.full_sacks;

  if v_src_bal.full_sacks < v_src_sacks then
    raise exception 'INSUFFICIENT_INVENTORY: Only % sacks are available. You entered %.',
      v_src_bal.full_sacks, v_src_sacks;
  end if;

  -- KG-based conversion: never copy sack counts across sizes
  v_source_kg := v_src_sacks * v_src_kg;
  if v_loss >= v_source_kg then
    raise exception 'VALIDATION: Loss (%) must be smaller than the total input KG (%).', v_loss, v_source_kg;
  end if;
  v_dest_kg := v_source_kg - v_loss;
  v_dest_sacks := floor(v_dest_kg / v_dst_kg);
  v_dest_loose := v_dest_kg - (v_dest_sacks * v_dst_kg);

  -- Lock/create destination stock
  v_dst_bal := public.lock_balance(v_dst_product_id, v_dst_type, v_dst_kg, true);
  v_dst_before_sacks := v_dst_bal.full_sacks;
  v_dst_before_loose := v_dst_bal.loose_kg;

  v_number := public.next_transaction_number('REB');
  insert into public.rebagging_transactions (transaction_number, notes, processed_by)
  values (v_number, v_notes, v_profile_id)
  returning id into v_tx_id;

  insert into public.rebagging_items (
    rebagging_transaction_id,
    source_rice_product_id, source_sack_size_type, source_sack_size_kg,
    source_sacks, source_kg,
    destination_rice_product_id, destination_sack_size_type, destination_sack_size_kg,
    destination_sacks, destination_kg, destination_loose_kg,
    loss_kg, loss_reason
  ) values (
    v_tx_id,
    v_src_product_id, v_src_type, v_src_kg,
    v_src_sacks, v_source_kg,
    v_dst_product_id, v_dst_type, v_dst_kg,
    v_dest_sacks, v_dest_kg, v_dest_loose,
    v_loss, v_loss_reason
  );

  update public.inventory_balances
  set full_sacks = full_sacks - v_src_sacks
  where id = v_src_bal.id;

  update public.inventory_balances
  set full_sacks = full_sacks + v_dest_sacks,
      loose_kg = loose_kg + v_dest_loose
  where id = v_dst_bal.id;

  insert into public.inventory_movements (
    rice_product_id, movement_type, sack_size_type, sack_size_kg,
    full_sacks_change, reference_type, reference_id, created_by
  ) values (
    v_src_product_id, 'REBAGGING_OUT', v_src_type, v_src_kg,
    -v_src_sacks, 'REBAGGING', v_tx_id, v_profile_id
  );

  insert into public.inventory_movements (
    rice_product_id, movement_type, sack_size_type, sack_size_kg,
    full_sacks_change, loose_kg_change, reference_type, reference_id, created_by
  ) values (
    v_dst_product_id, 'REBAGGING_IN', v_dst_type, v_dst_kg,
    v_dest_sacks, v_dest_loose, 'REBAGGING', v_tx_id, v_profile_id
  );

  perform public.write_audit(
    v_profile_id, 'RICE_REBAGGING_PROCESSED', 'rebagging_transaction', v_tx_id, null,
    jsonb_build_object(
      'transaction_number', v_number,
      'source_rice_id', v_src_product_id,
      'destination_rice_id', v_dst_product_id,
      'source_sacks', v_src_sacks,
      'source_kg', v_source_kg,
      'destination_sacks', v_dest_sacks,
      'destination_loose_kg', v_dest_loose,
      'loss_kg', v_loss
    )
  );

  return jsonb_build_object(
    'id', v_tx_id,
    'transaction_number', v_number,
    'source_kg', v_source_kg,
    'destination_kg', v_dest_kg,
    'destination_sacks', v_dest_sacks,
    'destination_loose_kg', v_dest_loose,
    'loss_kg', v_loss,
    'source_stock_before', v_src_before,
    'source_stock_after', v_src_before - v_src_sacks,
    'destination_stock_before', v_dst_before_sacks,
    'destination_stock_after', v_dst_before_sacks + v_dest_sacks,
    'destination_loose_before', v_dst_before_loose,
    'destination_loose_after', v_dst_before_loose + v_dest_loose
  );
end;
$$;

comment on function public.process_rice_rebagging(jsonb) is
  'RICE → RICE rebagging calculated in KG (sacks are never copied across sack sizes).';

-- ---------------------------------------------------------------------------
-- process_palay_to_rice(): PALAY (KG) → RICE (sacks), with yield and loss
-- ---------------------------------------------------------------------------

create or replace function public.process_palay_to_rice(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := public.require_permission('rebagging.create');
  v_src_product_id uuid := public.j_uuid(p_payload, 'source_rice_product_id');
  v_variety text := nullif(trim(coalesce(public.j_text(p_payload, 'variety'), '')), '');
  v_input_kg numeric := public.j_num(p_payload, 'palay_input_kg', null, true);
  v_dst_product_id uuid := public.j_uuid(p_payload, 'destination_rice_product_id');
  v_dst_type public.sack_size_type := public.j_text(p_payload, 'destination_sack_size_type', null, true)::public.sack_size_type;
  v_dst_kg numeric := public.j_num(p_payload, 'destination_sack_size_kg', null, true);
  v_output_sacks numeric := public.j_num(p_payload, 'rice_output_sacks', null, true);
  v_loss_reason text := public.j_text(p_payload, 'loss_reason');
  v_notes text := public.j_text(p_payload, 'notes');
  v_output_kg numeric;
  v_loss numeric;
  v_yield numeric;
  v_palay_bal public.palay_inventory_balances;
  v_rice_bal public.inventory_balances;
  v_palay_after numeric;
  v_rice_after numeric;
  v_dst_product public.rice_products;
  v_number text;
  v_conv_id uuid;
begin
  if v_input_kg is null or v_input_kg <= 0 then
    raise exception 'VALIDATION: Palay input must be greater than zero KG.';
  end if;
  if v_output_sacks is null or v_output_sacks < 0 then
    raise exception 'VALIDATION: Rice output must be zero or greater.';
  end if;
  if v_output_sacks = 0 then
    raise exception 'VALIDATION: Rice output must be at least one sack.';
  end if;

  select * into v_dst_product from public.rice_products where id = v_dst_product_id and is_active;
  if not found then
    raise exception 'VALIDATION: Destination rice product was not found or is inactive.';
  end if;

  v_palay_bal := public.lock_palay_balance(v_src_product_id, v_variety, false);

  if v_palay_bal.quantity_kg < v_input_kg then
    raise exception 'INSUFFICIENT_INVENTORY: Only % KG of palay is available. You entered % KG.',
      v_palay_bal.quantity_kg, v_input_kg;
  end if;

  v_output_kg := v_output_sacks * v_dst_kg;
  if v_output_kg > v_input_kg then
    raise exception 'VALIDATION: Rice output (%) KG cannot exceed palay input (%) KG.',
      v_output_kg, v_input_kg;
  end if;

  v_loss := v_input_kg - v_output_kg;
  v_yield := round((v_output_kg / v_input_kg) * 100, 2);

  v_number := public.next_transaction_number('CON');
  insert into public.palay_conversions (
    transaction_number, source_palay_inventory_id, source_rice_product_id, source_variety,
    palay_input_kg, destination_rice_product_id, destination_sack_size_type,
    destination_sack_size_kg, rice_output_sacks, rice_output_kg,
    yield_percentage, loss_kg, loss_reason, processed_by
  ) values (
    v_number, v_palay_bal.id, v_src_product_id, coalesce(v_variety, v_palay_bal.variety),
    v_input_kg, v_dst_product_id, v_dst_type,
    v_dst_kg, v_output_sacks, v_output_kg,
    v_yield, v_loss, v_loss_reason, v_profile_id
  )
  returning id into v_conv_id;

  update public.palay_inventory_balances
  set quantity_kg = quantity_kg - v_input_kg
  where id = v_palay_bal.id;

  v_rice_bal := public.lock_balance(v_dst_product_id, v_dst_type, v_dst_kg, true);
  v_rice_after := v_rice_bal.full_sacks + v_output_sacks;

  update public.inventory_balances
  set full_sacks = full_sacks + v_output_sacks
  where id = v_rice_bal.id;

  insert into public.inventory_movements (
    rice_product_id, movement_type, sack_size_type, sack_size_kg,
    full_sacks_change, reference_type, reference_id, created_by, notes
  ) values (
    v_dst_product_id, 'PALAY_CONVERSION_IN', v_dst_type, v_dst_kg,
    v_output_sacks, 'PALAY_CONVERSION', v_conv_id, v_profile_id,
    'Yield ' || v_yield::text || '%, loss ' || v_loss::text || ' KG'
  );

  v_palay_after := v_palay_bal.quantity_kg - v_input_kg;

  perform public.write_audit(
    v_profile_id, 'PALAY_CONVERSION_PROCESSED', 'palay_conversion', v_conv_id, null,
    jsonb_build_object(
      'transaction_number', v_number,
      'palay_input_kg', v_input_kg,
      'rice_output_sacks', v_output_sacks,
      'rice_output_kg', v_output_kg,
      'yield_percentage', v_yield,
      'loss_kg', v_loss
    )
  );

  return jsonb_build_object(
    'id', v_conv_id,
    'transaction_number', v_number,
    'palay_input_kg', v_input_kg,
    'rice_output_sacks', v_output_sacks,
    'rice_output_kg', v_output_kg,
    'yield_percentage', v_yield,
    'loss_kg', v_loss,
    'palay_stock_before', v_palay_bal.quantity_kg,
    'palay_stock_after', v_palay_after,
    'rice_stock_before', v_rice_bal.full_sacks,
    'rice_stock_after', v_rice_after
  );
end;
$$;

comment on function public.process_palay_to_rice(jsonb) is
  'Atomically converts palay KG into rice sacks: palay −, rice +, yield and loss recorded.';

-- ---------------------------------------------------------------------------
-- record_credit_payment(): never allows overpayment
-- ---------------------------------------------------------------------------

create or replace function public.record_credit_payment(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := public.require_permission('credits.payment');
  v_credit_id uuid := public.j_uuid(p_payload, 'credit_id');
  v_amount numeric := public.j_num(p_payload, 'amount', null, true);
  v_payment_method_text text := coalesce(public.j_text(p_payload, 'payment_method', 'CASH'), 'CASH');
  v_payment_method public.payment_method;
  v_notes text := public.j_text(p_payload, 'notes');
  v_payment_date timestamptz := coalesce(
    nullif(public.j_text(p_payload, 'payment_date'), '')::timestamptz, now());
  v_credit public.credits;
  v_new_paid numeric;
  v_new_balance numeric;
  v_new_status public.credit_status;
  v_payment_id uuid;
begin
  if v_payment_method_text not in ('CASH', 'GCASH', 'BANK_TRANSFER', 'CARD', 'CREDIT') then
    raise exception 'VALIDATION: Unknown payment method (%).', v_payment_method_text;
  end if;
  v_payment_method := v_payment_method_text::public.payment_method;

  if v_amount is null or v_amount <= 0 then
    raise exception 'VALIDATION: Payment amount must be greater than zero.';
  end if;

  -- Lock the credit so two cashiers cannot pay it at the same time
  select * into v_credit from public.credits where id = v_credit_id for update;
  if not found then
    raise exception 'VALIDATION: Credit record was not found.';
  end if;

  if v_amount > v_credit.balance then
    raise exception 'VALIDATION: Payment (%) exceeds the outstanding balance (%).',
      v_amount, v_credit.balance;
  end if;

  insert into public.credit_payments (credit_id, amount, payment_method, payment_date, confirmed_by, notes)
  values (v_credit_id, v_amount, v_payment_method, v_payment_date, v_profile_id, v_notes)
  returning id into v_payment_id;

  v_new_paid := v_credit.amount_paid + v_amount;
  v_new_balance := v_credit.balance - v_amount;
  v_new_balance := round(v_new_balance, 2);

  if v_new_balance <= 0 then
    v_new_status := 'PAID';
    v_new_balance := 0;
  elsif v_new_paid > 0 then
    v_new_status := 'PARTIALLY_PAID';
  else
    v_new_status := 'OPEN';
  end if;

  update public.credits
  set amount_paid = v_new_paid,
      balance = v_new_balance,
      status = v_new_status
  where id = v_credit_id;

  -- Keep the originating transaction in sync for reporting
  if v_credit.source_transaction_type = 'SALE' then
    update public.sales
    set amount_paid = amount_paid + v_amount,
        balance = total_amount - (amount_paid + v_amount),
        payment_status = public.derive_payment_status(total_amount, amount_paid + v_amount)
    where id = v_credit.source_transaction_id;
  elsif v_credit.source_transaction_type = 'TRANSFER' then
    update public.reseller_transfers
    set amount_paid = amount_paid + v_amount,
        balance = total_amount - (amount_paid + v_amount),
        payment_status = public.derive_payment_status(total_amount, amount_paid + v_amount)
    where id = v_credit.source_transaction_id;
  end if;

  perform public.write_audit(
    v_profile_id, 'CREDIT_PAYMENT_RECORDED', 'credit', v_credit_id,
    jsonb_build_object('amount_paid', v_credit.amount_paid, 'balance', v_credit.balance),
    jsonb_build_object('amount_paid', v_new_paid, 'balance', v_new_balance, 'status', v_new_status),
    jsonb_build_object('payment_id', v_payment_id, 'amount', v_amount)
  );

  return jsonb_build_object(
    'credit_id', v_credit_id,
    'payment_id', v_payment_id,
    'amount', v_amount,
    'amount_paid', v_new_paid,
    'balance', v_new_balance,
    'status', v_new_status,
    'fully_paid', v_new_balance = 0
  );
end;
$$;

comment on function public.record_credit_payment(jsonb) is
  'Records a credit payment atomically, blocks overpayment, and syncs the source transaction.';
