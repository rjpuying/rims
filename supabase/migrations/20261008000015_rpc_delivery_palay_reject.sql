-- 015 RPC helpers and inventory-mutating functions (part 1)
-- Pattern for every function:
--   authenticate → permission → validate → lock inventory → write business
--   rows → write inventory movement → update balance → audit → commit
-- All functions are SECURITY DEFINER (owner = postgres, bypasses RLS) and
-- atomic: any error rolls the whole transaction back.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from public.profiles where auth_user_id = auth.uid();
$$;

-- Raises NOT_AUTHENTICATED / FORBIDDEN unless the caller has the permission.
-- Returns the caller's profile id.
create or replace function public.require_permission(p_code text)
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED: You must be signed in.';
  end if;

  if not public.has_permission(p_code) then
    raise exception 'FORBIDDEN: You do not have permission to perform this action (%).', p_code;
  end if;

  select id into v_profile_id from public.profiles
  where auth_user_id = auth.uid() and is_active;

  if v_profile_id is null then
    raise exception 'FORBIDDEN: Your account is inactive.';
  end if;

  return v_profile_id;
end;
$$;

create or replace function public.write_audit(
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_old jsonb default null,
  p_new jsonb default null,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, metadata)
  values (p_user_id, p_action, p_entity_type, p_entity_id, p_old, p_new, p_metadata);
end;
$$;

-- Friendly JSON parsing (never expose Postgres conversion errors to users)
create or replace function public.j_text(p_json jsonb, p_key text, p_default text default null, p_required boolean default false)
returns text
language plpgsql
immutable
as $$
declare
  v jsonb := p_json -> p_key;
begin
  if v is null or jsonb_typeof(v) = 'null' then
    if p_required then
      raise exception 'VALIDATION: % is required.', p_key;
    end if;
    return p_default;
  end if;
  if jsonb_typeof(v) <> 'string' then
    raise exception 'VALIDATION: % must be text.', p_key;
  end if;
  return v #>> '{}';
end;
$$;

create or replace function public.j_num(p_json jsonb, p_key text, p_default numeric default null, p_required boolean default false)
returns numeric
language plpgsql
immutable
as $$
declare
  v jsonb := p_json -> p_key;
  s text;
begin
  if v is null or jsonb_typeof(v) = 'null' then
    if p_required then
      raise exception 'VALIDATION: % is required.', p_key;
    end if;
    return p_default;
  end if;
  if jsonb_typeof(v) = 'number' then
    return (v #>> '{}')::numeric;
  end if;
  if jsonb_typeof(v) = 'string' then
    s := v #>> '{}';
    if s ~ '^-?[0-9]+(\.[0-9]+)?$' then
      return s::numeric;
    end if;
  end if;
  raise exception 'VALIDATION: % must be a number.', p_key;
end;
$$;

create or replace function public.j_uuid(p_json jsonb, p_key text, p_required boolean default true)
returns uuid
language plpgsql
immutable
as $$
declare
  v jsonb := p_json -> p_key;
  s text;
begin
  if v is null or jsonb_typeof(v) = 'null' then
    if p_required then
      raise exception 'VALIDATION: % is required.', p_key;
    end if;
    return null;
  end if;
  s := v #>> '{}';
  if s !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    raise exception 'VALIDATION: % must be a valid id.', p_key;
  end if;
  return s::uuid;
end;
$$;

create or replace function public.derive_payment_status(p_total numeric, p_paid numeric)
returns public.payment_status
language sql
immutable
as $$
  select case
    when p_paid >= p_total then 'PAID'::public.payment_status
    when p_paid <= 0 then 'UNPAID'
    else 'PARTIALLY_PAID'
  end;
$$;

-- Lock (and optionally create) a rice inventory balance row.
create or replace function public.lock_balance(
  p_rice_product_id uuid,
  p_sack_size_type public.sack_size_type,
  p_sack_size_kg numeric,
  p_create boolean default false
)
returns public.inventory_balances
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_bal public.inventory_balances;
begin
  if p_sack_size_kg <= 0 then
    raise exception 'VALIDATION: Sack size must be greater than zero.';
  end if;
  if (p_sack_size_type = '25KG' and p_sack_size_kg <> 25)
     or (p_sack_size_type = '50KG' and p_sack_size_kg <> 50) then
    raise exception 'VALIDATION: Sack size does not match the selected sack size.';
  end if;

  select * into v_bal
  from public.inventory_balances
  where rice_product_id = p_rice_product_id
    and sack_size_type = p_sack_size_type
    and sack_size_kg = p_sack_size_kg
  for update;

  if not found then
    if not p_create then
      raise exception 'INSUFFICIENT_INVENTORY: No stock is available for this sack size.';
    end if;
    insert into public.inventory_balances (rice_product_id, sack_size_type, sack_size_kg)
    values (p_rice_product_id, p_sack_size_type, p_sack_size_kg)
    returning * into v_bal;
  end if;

  return v_bal;
end;
$$;

-- Lock (and optionally create) a palay balance row.
create or replace function public.lock_palay_balance(
  p_rice_product_id uuid,
  p_variety text,
  p_create boolean default false
)
returns public.palay_inventory_balances
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_bal public.palay_inventory_balances;
begin
  select * into v_bal
  from public.palay_inventory_balances
  where rice_product_id = p_rice_product_id
    and coalesce(variety, '') = coalesce(p_variety, '')
  for update;

  if not found then
    if not p_create then
      raise exception 'INSUFFICIENT_INVENTORY: No palay stock is available for this product.';
    end if;
    insert into public.palay_inventory_balances (rice_product_id, variety, quantity_kg)
    values (p_rice_product_id, p_variety, 0)
    returning * into v_bal;
  end if;

  return v_bal;
end;
$$;

-- ---------------------------------------------------------------------------
-- receive_delivery(): stock IN
-- ---------------------------------------------------------------------------

create or replace function public.receive_delivery(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := public.require_permission('delivery.create');
  v_supplier text := trim(public.j_text(p_payload, 'supplier_name', null, true));
  v_notes text := public.j_text(p_payload, 'notes');
  v_delivery_date timestamptz := coalesce(
    nullif(public.j_text(p_payload, 'delivery_date'), '')::timestamptz, now());
  v_amount_paid numeric := coalesce(public.j_num(p_payload, 'amount_paid', 0), 0);
  v_total numeric := 0;
  v_balance numeric;
  v_status public.payment_status;
  v_number text;
  v_delivery_id uuid;
  v_item jsonb;
  v_product public.rice_products;
  v_bal public.inventory_balances;
  v_qty numeric;
  v_price numeric;
  v_line numeric;
  v_size_type public.sack_size_type;
  v_size_kg numeric;
  v_items jsonb := '[]'::jsonb;
begin
  if length(v_supplier) = 0 then
    raise exception 'VALIDATION: Supplier name is required.';
  end if;
  if v_amount_paid < 0 then
    raise exception 'VALIDATION: Amount paid cannot be negative.';
  end if;
  if p_payload -> 'items' is null or jsonb_typeof(p_payload -> 'items') <> 'array'
     or jsonb_array_length(p_payload -> 'items') = 0 then
    raise exception 'VALIDATION: Add at least one rice item to this delivery.';
  end if;

  v_number := public.next_transaction_number('DEL');
  insert into public.deliveries (transaction_number, delivery_date, supplier_name, notes, received_by)
  values (v_number, v_delivery_date, v_supplier, v_notes, v_profile_id)
  returning id into v_delivery_id;

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

    v_line := round(v_qty * v_price, 2);
    v_total := v_total + v_line;

    insert into public.delivery_items (
      delivery_id, rice_product_id, rice_type, variety, quantity_sacks,
      sack_size_type, sack_size_kg, price_per_sack, total_amount, batch_number
    ) values (
      v_delivery_id, v_product.id, v_product.rice_type, v_product.variety, v_qty,
      v_size_type, v_size_kg, v_price, v_line, public.j_text(v_item, 'batch_number')
    );

    insert into public.delivery_batches (
      delivery_id, batch_number, transaction_number, rice_product_id,
      rice_name_snapshot, rice_type_snapshot, variety_snapshot, supplier_name,
      quantity_sacks, sack_size_type, sack_size_kg, price_per_sack, received_date
    ) values (
      v_delivery_id, public.j_text(v_item, 'batch_number'), v_number, v_product.id,
      v_product.rice_name, v_product.rice_type, v_product.variety, v_supplier,
      v_qty, v_size_type, v_size_kg, v_price, v_delivery_date
    );

    v_bal := public.lock_balance(v_product.id, v_size_type, v_size_kg, true);

    update public.inventory_balances
    set full_sacks = full_sacks + v_qty
    where id = v_bal.id;

    insert into public.inventory_movements (
      rice_product_id, movement_type, sack_size_type, sack_size_kg,
      full_sacks_change, reference_type, reference_id, created_by
    ) values (
      v_product.id, 'DELIVERY_RECEIVED', v_size_type, v_size_kg,
      v_qty, 'DELIVERY', v_delivery_id, v_profile_id
    );

    v_items := v_items || jsonb_build_object(
      'rice_product_id', v_product.id,
      'rice_name', v_product.rice_name,
      'quantity_sacks', v_qty,
      'sack_size_type', v_size_type,
      'sack_size_kg', v_size_kg,
      'line_total', v_line
    );
  end loop;

  if v_amount_paid > v_total then
    raise exception 'VALIDATION: Amount paid (%) cannot exceed the delivery total (%).', v_amount_paid, v_total;
  end if;

  v_balance := v_total - v_amount_paid;
  v_status := public.derive_payment_status(v_total, v_amount_paid);

  update public.deliveries
  set total_amount = v_total,
      amount_paid = v_amount_paid,
      balance = v_balance,
      payment_status = v_status
  where id = v_delivery_id;

  perform public.write_audit(
    v_profile_id, 'DELIVERY_RECEIVED', 'delivery', v_delivery_id,
    null,
    jsonb_build_object('transaction_number', v_number, 'supplier_name', v_supplier,
                       'total_amount', v_total, 'amount_paid', v_amount_paid),
    jsonb_build_object('items', v_items)
  );

  return jsonb_build_object(
    'id', v_delivery_id,
    'transaction_number', v_number,
    'total_amount', v_total,
    'amount_paid', v_amount_paid,
    'balance', v_balance,
    'payment_status', v_status,
    'items', v_items
  );
end;
$$;

comment on function public.receive_delivery(jsonb) is
  'Atomically records a delivery, creates batch history, and increases rice inventory.';

-- ---------------------------------------------------------------------------
-- receive_palay(): palay IN (KG only — never touches rice inventory)
-- ---------------------------------------------------------------------------

create or replace function public.receive_palay(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := public.require_permission('palay.create');
  v_farmer text := trim(public.j_text(p_payload, 'farmer_name', null, true));
  v_notes text := public.j_text(p_payload, 'notes');
  v_receipt_date timestamptz := coalesce(
    nullif(public.j_text(p_payload, 'receipt_date'), '')::timestamptz, now());
  v_amount_paid numeric := coalesce(public.j_num(p_payload, 'amount_paid', 0), 0);
  v_total numeric := 0;
  v_balance numeric;
  v_status public.payment_status;
  v_number text;
  v_receipt_id uuid;
  v_item jsonb;
  v_product public.rice_products;
  v_bal public.palay_inventory_balances;
  v_kg numeric;
  v_price numeric;
  v_line numeric;
  v_variety text;
  v_total_kg numeric := 0;
  v_items jsonb := '[]'::jsonb;
begin
  if length(v_farmer) = 0 then
    raise exception 'VALIDATION: Farmer name is required.';
  end if;
  if v_amount_paid < 0 then
    raise exception 'VALIDATION: Amount paid cannot be negative.';
  end if;
  if p_payload -> 'items' is null or jsonb_typeof(p_payload -> 'items') <> 'array'
     or jsonb_array_length(p_payload -> 'items') = 0 then
    raise exception 'VALIDATION: Add at least one palay item to this receipt.';
  end if;

  v_number := public.next_transaction_number('PAL');
  insert into public.palay_receipts (transaction_number, receipt_date, farmer_name, notes, received_by)
  values (v_number, v_receipt_date, v_farmer, v_notes, v_profile_id)
  returning id into v_receipt_id;

  for v_item in select * from jsonb_array_elements(p_payload -> 'items') loop
    v_kg := public.j_num(v_item, 'quantity_kg', null, true);
    v_price := public.j_num(v_item, 'price_per_kg', null, true);
    v_variety := nullif(trim(public.j_text(v_item, 'variety')), '');

    if v_kg is null or v_kg <= 0 then
      raise exception 'VALIDATION: Quantity in KG must be greater than zero.';
    end if;
    if v_price is null or v_price < 0 then
      raise exception 'VALIDATION: Price per KG cannot be negative.';
    end if;

    select * into v_product from public.rice_products
    where id = public.j_uuid(v_item, 'rice_product_id') and is_active;
    if not found then
      raise exception 'VALIDATION: Selected rice product was not found or is inactive.';
    end if;

    v_line := round(v_kg * v_price, 2);
    v_total := v_total + v_line;
    v_total_kg := v_total_kg + v_kg;

    insert into public.palay_receipt_items (
      palay_receipt_id, rice_product_id, rice_name_snapshot, variety,
      quantity_kg, price_per_kg, total_amount
    ) values (
      v_receipt_id, v_product.id, v_product.rice_name, coalesce(v_variety, v_product.variety),
      v_kg, v_price, v_line
    );

    v_bal := public.lock_palay_balance(
      v_product.id, coalesce(v_variety, v_product.variety), true);

    update public.palay_inventory_balances
    set quantity_kg = quantity_kg + v_kg
    where id = v_bal.id;

    v_items := v_items || jsonb_build_object(
      'rice_product_id', v_product.id,
      'rice_name', v_product.rice_name,
      'variety', coalesce(v_variety, v_product.variety),
      'quantity_kg', v_kg,
      'line_total', v_line
    );
  end loop;

  if v_amount_paid > v_total then
    raise exception 'VALIDATION: Amount paid (%) cannot exceed the receipt total (%).', v_amount_paid, v_total;
  end if;

  v_balance := v_total - v_amount_paid;
  v_status := public.derive_payment_status(v_total, v_amount_paid);

  update public.palay_receipts
  set total_amount = v_total,
      amount_paid = v_amount_paid,
      balance = v_balance,
      payment_status = v_status
  where id = v_receipt_id;

  perform public.write_audit(
    v_profile_id, 'PALAY_RECEIVED', 'palay_receipt', v_receipt_id,
    null,
    jsonb_build_object('transaction_number', v_number, 'farmer_name', v_farmer,
                       'total_amount', v_total, 'amount_paid', v_amount_paid),
    jsonb_build_object('items', v_items)
  );

  return jsonb_build_object(
    'id', v_receipt_id,
    'transaction_number', v_number,
    'total_amount', v_total,
    'amount_paid', v_amount_paid,
    'balance', v_balance,
    'payment_status', v_status,
    'total_kg', v_total_kg,
    'items', v_items
  );
end;
$$;

comment on function public.receive_palay(jsonb) is
  'Atomically records a palay receipt and increases palay inventory (KG). Never affects rice inventory.';

-- ---------------------------------------------------------------------------
-- record_reject(): available stock → rejected stock
-- ---------------------------------------------------------------------------

create or replace function public.record_reject(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := public.require_permission('inventory.reject');
  v_product_id uuid := public.j_uuid(p_payload, 'rice_product_id');
  v_size_type public.sack_size_type := public.j_text(p_payload, 'sack_size_type', null, true)::public.sack_size_type;
  v_size_kg numeric := public.j_num(p_payload, 'sack_size_kg', null, true);
  v_qty numeric := public.j_num(p_payload, 'quantity_sacks', null, true);
  v_reason text := public.j_text(p_payload, 'reason');
  v_product public.rice_products;
  v_bal public.inventory_balances;
  v_reject_id uuid;
begin
  if v_qty is null or v_qty <= 0 then
    raise exception 'VALIDATION: Quantity must be greater than zero.';
  end if;

  select * into v_product from public.rice_products where id = v_product_id and is_active;
  if not found then
    raise exception 'VALIDATION: Selected rice product was not found or is inactive.';
  end if;

  v_bal := public.lock_balance(v_product_id, v_size_type, v_size_kg, false);

  if v_bal.full_sacks < v_qty then
    raise exception 'INSUFFICIENT_INVENTORY: Only % sacks are available. You entered %.',
      v_bal.full_sacks, v_qty;
  end if;

  update public.inventory_balances
  set full_sacks = full_sacks - v_qty,
      rejected_sacks = rejected_sacks + v_qty
  where id = v_bal.id;

  insert into public.rejected_stock (
    rice_product_id, sack_size_type, sack_size_kg, quantity_sacks, reason, processed_by
  ) values (
    v_product_id, v_size_type, v_size_kg, v_qty, v_reason, v_profile_id
  )
  returning id into v_reject_id;

  insert into public.inventory_movements (
    rice_product_id, movement_type, sack_size_type, sack_size_kg,
    full_sacks_change, rejected_sacks_change, reference_type, reference_id, notes, created_by
  ) values (
    v_product_id, 'REJECT', v_size_type, v_size_kg,
    -v_qty, v_qty, 'REJECT', v_reject_id, v_reason, v_profile_id
  );

  perform public.write_audit(
    v_profile_id, 'INVENTORY_REJECTED', 'rejected_stock', v_reject_id, null,
    jsonb_build_object('rice_product_id', v_product_id, 'quantity_sacks', v_qty,
                       'sack_size_type', v_size_type, 'reason', v_reason)
  );

  return jsonb_build_object(
    'id', v_reject_id,
    'rice_product_id', v_product_id,
    'quantity_sacks', v_qty,
    'available_after', v_bal.full_sacks - v_qty,
    'rejected_after', v_bal.rejected_sacks + v_qty
  );
end;
$$;

comment on function public.record_reject(jsonb) is
  'Moves stock from available sacks to rejected sacks atomically.';
