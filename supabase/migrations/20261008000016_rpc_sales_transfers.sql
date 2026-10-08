-- 016 RPC part 2: process_sale() and process_reseller_transfer()

-- ---------------------------------------------------------------------------
-- process_sale(): the fastest, safest path through the POS
-- ---------------------------------------------------------------------------

create or replace function public.process_sale(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := public.require_permission('sales.create');
  v_customer text := nullif(trim(coalesce(public.j_text(p_payload, 'customer_name'), '')), '');
  v_sale_date timestamptz := coalesce(
    nullif(public.j_text(p_payload, 'sale_date'), '')::timestamptz, now());
  v_payment_method_text text := coalesce(public.j_text(p_payload, 'payment_method', 'CASH'), 'CASH');
  v_payment_method public.payment_method;
  v_amount_paid numeric := coalesce(public.j_num(p_payload, 'amount_paid', 0), 0);
  v_header_discount numeric := coalesce(public.j_num(p_payload, 'discount_amount', 0), 0);
  v_subtotal numeric := 0;
  v_item_discounts numeric := 0;
  v_total numeric;
  v_balance numeric;
  v_status public.payment_status;
  v_number text;
  v_sale_id uuid;
  v_item jsonb;
  v_product public.rice_products;
  v_bal public.inventory_balances;
  v_method text;
  v_size_type public.sack_size_type;
  v_size_kg numeric;
  v_qty_sacks numeric;
  v_qty_kg numeric;
  v_price_sack numeric;
  v_price_kg numeric;
  v_item_discount numeric;
  v_line_before numeric;
  v_line_total numeric;
  v_stock_before_sacks numeric;
  v_stock_before_loose numeric;
  v_opened_sacks numeric := 0;
  v_new_sacks numeric;
  v_new_loose numeric;
  v_items jsonb := '[]'::jsonb;
  v_credit_id uuid;
  v_item_count integer := 0;
begin
  if v_payment_method_text not in ('CASH', 'GCASH', 'BANK_TRANSFER', 'CARD', 'CREDIT') then
    raise exception 'VALIDATION: Unknown payment method (%).', v_payment_method_text;
  end if;
  v_payment_method := v_payment_method_text::public.payment_method;

  if v_amount_paid < 0 then
    raise exception 'VALIDATION: Amount paid cannot be negative.';
  end if;
  if v_header_discount < 0 then
    raise exception 'VALIDATION: Discount cannot be negative.';
  end if;
  if p_payload -> 'items' is null or jsonb_typeof(p_payload -> 'items') <> 'array'
     or jsonb_array_length(p_payload -> 'items') = 0 then
    raise exception 'VALIDATION: Add at least one item to this sale.';
  end if;

  v_number := public.next_transaction_number('SAL');
  insert into public.sales (
    transaction_number, sale_date, customer_name, payment_method, processed_by
  ) values (
    v_number, v_sale_date, v_customer, v_payment_method, v_profile_id
  )
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_payload -> 'items') loop
    v_item_count := v_item_count + 1;
    v_method := public.j_text(v_item, 'selling_method', null, true);
    v_size_type := public.j_text(v_item, 'sack_size_type', null, true)::public.sack_size_type;
    v_size_kg := public.j_num(v_item, 'sack_size_kg', null, true);
    v_qty_sacks := coalesce(public.j_num(v_item, 'quantity_sacks', 0), 0);
    v_qty_kg := coalesce(public.j_num(v_item, 'quantity_kg', 0), 0);
    v_price_sack := coalesce(public.j_num(v_item, 'price_per_sack', 0), 0);
    v_price_kg := coalesce(public.j_num(v_item, 'price_per_kg', 0), 0);
    v_item_discount := coalesce(public.j_num(v_item, 'discount', 0), 0);

    select * into v_product from public.rice_products
    where id = public.j_uuid(v_item, 'rice_product_id') and is_active;
    if not found then
      raise exception 'VALIDATION: Selected rice product was not found or is inactive.';
    end if;

    v_bal := public.lock_balance(v_product.id, v_size_type, v_size_kg, false);
    v_stock_before_sacks := v_bal.full_sacks;
    v_stock_before_loose := v_bal.loose_kg;

    if v_method = 'PER_SACK' then
      if v_qty_sacks <= 0 then
        raise exception 'VALIDATION: Quantity must be greater than zero.';
      end if;
      if v_price_sack <= 0 then
        raise exception 'VALIDATION: Price per sack must be greater than zero.';
      end if;
      if v_bal.full_sacks < v_qty_sacks then
        raise exception 'INSUFFICIENT_INVENTORY: Only % sacks are available. You entered %.',
          v_bal.full_sacks, v_qty_sacks;
      end if;

      v_line_before := round(v_qty_sacks * v_price_sack, 2);
      if v_item_discount > v_line_before then
        raise exception 'VALIDATION: Line discount cannot exceed the line total.';
      end if;
      v_line_total := v_line_before - v_item_discount;

      update public.inventory_balances
      set full_sacks = full_sacks - v_qty_sacks
      where id = v_bal.id;

      insert into public.inventory_movements (
        rice_product_id, movement_type, sack_size_type, sack_size_kg,
        full_sacks_change, reference_type, reference_id, created_by
      ) values (
        v_product.id, 'SALE', v_size_type, v_size_kg,
        -v_qty_sacks, 'SALE', v_sale_id, v_profile_id
      );

      v_items := v_items || jsonb_build_object(
        'rice_product_id', v_product.id,
        'rice_name', v_product.rice_name,
        'selling_method', v_method,
        'sack_size_type', v_size_type,
        'sack_size_kg', v_size_kg,
        'quantity_sacks', v_qty_sacks,
        'quantity_kg', 0,
        'price_per_sack', v_price_sack,
        'price_per_kg', 0,
        'line_total', v_line_total,
        'stock_before', v_stock_before_sacks,
        'stock_after', v_stock_before_sacks - v_qty_sacks
      );

    elsif v_method = 'PER_KG' then
      if v_qty_kg <= 0 then
        raise exception 'VALIDATION: Quantity in KG must be greater than zero.';
      end if;
      if v_price_kg <= 0 then
        raise exception 'VALIDATION: Price per KG must be greater than zero.';
      end if;

      -- Consume loose KG first, then open whole sacks as needed.
      v_opened_sacks := 0;
      if v_bal.loose_kg < v_qty_kg then
        v_opened_sacks := ceil((v_qty_kg - v_bal.loose_kg) / v_bal.sack_size_kg);
        if v_bal.full_sacks < v_opened_sacks then
          raise exception 'INSUFFICIENT_INVENTORY: Only % sacks and % KG loose are available for this sale.',
            v_bal.full_sacks, v_bal.loose_kg;
        end if;
      end if;

      v_new_sacks := v_bal.full_sacks - v_opened_sacks;
      v_new_loose := v_bal.loose_kg + (v_opened_sacks * v_bal.sack_size_kg) - v_qty_kg;

      v_line_before := round(v_qty_kg * v_price_kg, 2);
      if v_item_discount > v_line_before then
        raise exception 'VALIDATION: Line discount cannot exceed the line total.';
      end if;
      v_line_total := v_line_before - v_item_discount;

      update public.inventory_balances
      set full_sacks = v_new_sacks,
          loose_kg = v_new_loose
      where id = v_bal.id;

      insert into public.inventory_movements (
        rice_product_id, movement_type, sack_size_type, sack_size_kg,
        full_sacks_change, loose_kg_change, reference_type, reference_id, created_by
      ) values (
        v_product.id, 'SALE', v_size_type, v_size_kg,
        -v_opened_sacks, v_new_loose - v_bal.loose_kg, 'SALE', v_sale_id, v_profile_id
      );

      v_items := v_items || jsonb_build_object(
        'rice_product_id', v_product.id,
        'rice_name', v_product.rice_name,
        'selling_method', v_method,
        'sack_size_type', v_size_type,
        'sack_size_kg', v_size_kg,
        'quantity_sacks', 0,
        'quantity_kg', v_qty_kg,
        'price_per_sack', 0,
        'price_per_kg', v_price_kg,
        'line_total', v_line_total,
        'sacks_opened', v_opened_sacks,
        'stock_before', v_stock_before_sacks,
        'stock_after', v_new_sacks,
        'loose_before', v_stock_before_loose,
        'loose_after', v_new_loose
      );
    else
      raise exception 'VALIDATION: Unknown selling method (%).', v_method;
    end if;

    v_subtotal := v_subtotal + v_line_before;
    v_item_discounts := v_item_discounts + v_item_discount;

    insert into public.sale_items (
      sale_id, rice_product_id, rice_name_snapshot, rice_type_snapshot, variety_snapshot,
      selling_method, sack_size_type, sack_size_kg, quantity_sacks, quantity_kg,
      price_per_sack, price_per_kg, discount_amount, line_total
    ) values (
      v_sale_id, v_product.id, v_product.rice_name, v_product.rice_type, v_product.variety,
      v_method::public.selling_method, v_size_type, v_size_kg, v_qty_sacks, v_qty_kg,
      v_price_sack, v_price_kg, v_item_discount, v_line_total
    );
  end loop;

  if v_header_discount > (v_subtotal - v_item_discounts) then
    raise exception 'VALIDATION: Discount cannot exceed the sale total.';
  end if;

  v_total := round(v_subtotal - v_item_discounts - v_header_discount, 2);

  if v_amount_paid > v_total then
    raise exception 'VALIDATION: Amount paid (%) cannot exceed the sale total (%).', v_amount_paid, v_total;
  end if;

  v_balance := v_total - v_amount_paid;
  v_status := public.derive_payment_status(v_total, v_amount_paid);

  if v_balance > 0 and v_customer is null then
    raise exception 'VALIDATION: Customer name is required for credit sales.';
  end if;

  update public.sales
  set subtotal = v_subtotal,
      discount_amount = v_item_discounts + v_header_discount,
      total_amount = v_total,
      amount_paid = v_amount_paid,
      balance = v_balance,
      payment_status = v_status
  where id = v_sale_id;

  if v_amount_paid > 0 then
    insert into public.sale_payments (sale_id, payment_method, amount, confirmed_by)
    values (v_sale_id, v_payment_method, v_amount_paid, v_profile_id);
  end if;

  if v_balance > 0 then
    insert into public.credits (
      credit_type, source_transaction_type, source_transaction_id,
      party_name, original_amount, amount_paid, balance, status
    ) values (
      'SALE', 'SALE', v_sale_id, v_customer, v_total, v_amount_paid, v_balance,
      (case when v_amount_paid > 0 then 'PARTIALLY_PAID' else 'OPEN' end)::public.credit_status
    )
    returning id into v_credit_id;
  end if;

  perform public.write_audit(
    v_profile_id, 'SALE_CREATED', 'sale', v_sale_id, null,
    jsonb_build_object(
      'transaction_number', v_number,
      'customer_name', v_customer,
      'total_amount', v_total,
      'amount_paid', v_amount_paid,
      'balance', v_balance,
      'payment_status', v_status
    ),
    jsonb_build_object('items', v_items, 'item_count', v_item_count)
  );

  return jsonb_build_object(
    'id', v_sale_id,
    'transaction_number', v_number,
    'subtotal', v_subtotal,
    'discount_amount', v_item_discounts + v_header_discount,
    'total_amount', v_total,
    'amount_paid', v_amount_paid,
    'balance', v_balance,
    'payment_status', v_status,
    'credit_id', v_credit_id,
    'items', v_items
  );
end;
$$;

comment on function public.process_sale(jsonb) is
  'Atomically creates a sale, deducts inventory (opening sacks for PER_KG), creates payment, credit, and audit log.';

-- ---------------------------------------------------------------------------
-- process_reseller_transfer(): My Warehouse → Reseller
-- ---------------------------------------------------------------------------

create or replace function public.process_reseller_transfer(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := public.require_permission('transfer.create');
  v_reseller text := trim(public.j_text(p_payload, 'reseller_name', null, true));
  v_notes text := public.j_text(p_payload, 'notes');
  v_transfer_date timestamptz := coalesce(
    nullif(public.j_text(p_payload, 'transfer_date'), '')::timestamptz, now());
  v_payment_method_text text := coalesce(public.j_text(p_payload, 'payment_method', 'CASH'), 'CASH');
  v_payment_method public.payment_method;
  v_amount_paid numeric := coalesce(public.j_num(p_payload, 'amount_paid', 0), 0);
  v_total numeric := 0;
  v_balance numeric;
  v_status public.payment_status;
  v_number text;
  v_transfer_id uuid;
  v_item jsonb;
  v_product public.rice_products;
  v_bal public.inventory_balances;
  v_qty numeric;
  v_price numeric;
  v_line numeric;
  v_size_type public.sack_size_type;
  v_size_kg numeric;
  v_stock_before numeric;
  v_items jsonb := '[]'::jsonb;
  v_credit_id uuid;
begin
  if length(v_reseller) = 0 then
    raise exception 'VALIDATION: Reseller name is required.';
  end if;
  if v_payment_method_text not in ('CASH', 'GCASH', 'BANK_TRANSFER', 'CARD', 'CREDIT') then
    raise exception 'VALIDATION: Unknown payment method (%).', v_payment_method_text;
  end if;
  v_payment_method := v_payment_method_text::public.payment_method;

  if v_amount_paid < 0 then
    raise exception 'VALIDATION: Amount paid cannot be negative.';
  end if;
  if p_payload -> 'items' is null or jsonb_typeof(p_payload -> 'items') <> 'array'
     or jsonb_array_length(p_payload -> 'items') = 0 then
    raise exception 'VALIDATION: Add at least one item to this transfer.';
  end if;

  v_number := public.next_transaction_number('TRF');
  insert into public.reseller_transfers (
    transaction_number, transfer_date, reseller_name, notes, confirmed_by
  ) values (
    v_number, v_transfer_date, v_reseller, v_notes, v_profile_id
  )
  returning id into v_transfer_id;

  for v_item in select * from jsonb_array_elements(p_payload -> 'items') loop
    v_qty := public.j_num(v_item, 'quantity_sacks', null, true);
    v_price := public.j_num(v_item, 'price_per_sack', null, true);
    v_size_kg := public.j_num(v_item, 'sack_size_kg', null, true);
    v_size_type := public.j_text(v_item, 'sack_size_type', null, true)::public.sack_size_type;

    if v_qty is null or v_qty <= 0 then
      raise exception 'VALIDATION: Quantity must be greater than zero.';
    end if;
    if v_price is null or v_price < 0 then
      raise exception 'VALIDATION: Price per sack cannot be negative.';
    end if;

    select * into v_product from public.rice_products
    where id = public.j_uuid(v_item, 'rice_product_id') and is_active;
    if not found then
      raise exception 'VALIDATION: Selected rice product was not found or is inactive.';
    end if;

    v_bal := public.lock_balance(v_product.id, v_size_type, v_size_kg, false);
    v_stock_before := v_bal.full_sacks;

    if v_bal.full_sacks < v_qty then
      raise exception 'INSUFFICIENT_INVENTORY: Only % sacks are available. You entered %.',
        v_bal.full_sacks, v_qty;
    end if;

    v_line := round(v_qty * v_price, 2);
    v_total := v_total + v_line;

    update public.inventory_balances
    set full_sacks = full_sacks - v_qty
    where id = v_bal.id;

    insert into public.inventory_movements (
      rice_product_id, movement_type, sack_size_type, sack_size_kg,
      full_sacks_change, reference_type, reference_id, created_by
    ) values (
      v_product.id, 'TRANSFER_TO_RESELLER', v_size_type, v_size_kg,
      -v_qty, 'TRANSFER', v_transfer_id, v_profile_id
    );

    insert into public.reseller_transfer_items (
      reseller_transfer_id, rice_product_id, rice_name_snapshot, rice_type_snapshot,
      variety_snapshot, sack_size_type, sack_size_kg, quantity_sacks, price_per_sack, line_total
    ) values (
      v_transfer_id, v_product.id, v_product.rice_name, v_product.rice_type,
      v_product.variety, v_size_type, v_size_kg, v_qty, v_price, v_line
    );

    v_items := v_items || jsonb_build_object(
      'rice_product_id', v_product.id,
      'rice_name', v_product.rice_name,
      'quantity_sacks', v_qty,
      'sack_size_type', v_size_type,
      'sack_size_kg', v_size_kg,
      'price_per_sack', v_price,
      'line_total', v_line,
      'stock_before', v_stock_before,
      'stock_after', v_stock_before - v_qty
    );
  end loop;

  if v_amount_paid > v_total then
    raise exception 'VALIDATION: Amount paid (%) cannot exceed the transfer total (%).', v_amount_paid, v_total;
  end if;

  v_balance := v_total - v_amount_paid;
  v_status := public.derive_payment_status(v_total, v_amount_paid);

  update public.reseller_transfers
  set total_amount = v_total,
      amount_paid = v_amount_paid,
      balance = v_balance,
      payment_status = v_status
  where id = v_transfer_id;

  if v_amount_paid > 0 then
    insert into public.reseller_transfer_payments (
      reseller_transfer_id, payment_method, amount, confirmed_by
    ) values (v_transfer_id, v_payment_method, v_amount_paid, v_profile_id);
  end if;

  if v_balance > 0 then
    insert into public.credits (
      credit_type, source_transaction_type, source_transaction_id,
      party_name, original_amount, amount_paid, balance, status
    ) values (
      'RESELLER_TRANSFER', 'TRANSFER', v_transfer_id, v_reseller, v_total, v_amount_paid, v_balance,
      (case when v_amount_paid > 0 then 'PARTIALLY_PAID' else 'OPEN' end)::public.credit_status
    )
    returning id into v_credit_id;
  end if;

  perform public.write_audit(
    v_profile_id, 'RESELLER_TRANSFER_CREATED', 'reseller_transfer', v_transfer_id, null,
    jsonb_build_object(
      'transaction_number', v_number,
      'reseller_name', v_reseller,
      'total_amount', v_total,
      'amount_paid', v_amount_paid,
      'balance', v_balance,
      'payment_status', v_status
    ),
    jsonb_build_object('items', v_items)
  );

  return jsonb_build_object(
    'id', v_transfer_id,
    'transaction_number', v_number,
    'total_amount', v_total,
    'amount_paid', v_amount_paid,
    'balance', v_balance,
    'payment_status', v_status,
    'credit_id', v_credit_id,
    'items', v_items
  );
end;
$$;

comment on function public.process_reseller_transfer(jsonb) is
  'Atomically transfers stock from the warehouse to a reseller, creating a credit when unpaid.';
