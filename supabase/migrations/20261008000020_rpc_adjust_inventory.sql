-- 020 RPC part 4: adjust_inventory() — physical stock-count correction

create or replace function public.adjust_inventory(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := public.require_permission('inventory.adjust');
  v_product_id uuid := public.j_uuid(p_payload, 'rice_product_id');
  v_size_type public.sack_size_type := public.j_text(p_payload, 'sack_size_type', null, true)::public.sack_size_type;
  v_size_kg numeric := public.j_num(p_payload, 'sack_size_kg', null, true);
  v_new_sacks numeric := public.j_num(p_payload, 'new_full_sacks', null, true);
  v_new_loose numeric := coalesce(public.j_num(p_payload, 'new_loose_kg'), null);
  v_reason text := nullif(trim(coalesce(public.j_text(p_payload, 'reason'), '')), '');
  v_notes text := public.j_text(p_payload, 'notes');
  v_product public.rice_products;
  v_bal public.inventory_balances;
  v_old_sacks numeric;
  v_old_loose numeric;
  v_delta_sacks numeric;
  v_delta_loose numeric;
begin
  if v_new_sacks is null or v_new_sacks < 0 then
    raise exception 'VALIDATION: New full sacks must be zero or greater.';
  end if;
  if v_reason is null then
    raise exception 'VALIDATION: A reason is required for inventory adjustments.';
  end if;
  if v_size_kg is null or v_size_kg <= 0 then
    raise exception 'VALIDATION: Sack size in KG must be greater than zero.';
  end if;

  select * into v_product from public.rice_products where id = v_product_id and is_active;
  if not found then
    raise exception 'VALIDATION: Selected rice product was not found or is inactive.';
  end if;

  v_bal := public.lock_balance(v_product_id, v_size_type, v_size_kg, true);
  v_old_sacks := v_bal.full_sacks;
  v_old_loose := v_bal.loose_kg;
  if v_new_loose is null then
    v_new_loose := v_old_loose;
  end if;
  if v_new_loose < 0 then
    raise exception 'VALIDATION: New loose KG must be zero or greater.';
  end if;

  v_delta_sacks := v_new_sacks - v_old_sacks;
  v_delta_loose := round(v_new_loose - v_old_loose, 3);

  if v_delta_sacks = 0 and v_delta_loose = 0 then
    raise exception 'VALIDATION: This adjustment would not change the stock count.';
  end if;

  update public.inventory_balances
  set full_sacks = v_new_sacks,
      loose_kg = v_new_loose
  where id = v_bal.id;

  insert into public.inventory_movements (
    rice_product_id, movement_type, sack_size_type, sack_size_kg,
    full_sacks_change, loose_kg_change, reference_type, notes, created_by
  ) values (
    v_product_id, 'STOCK_ADJUSTMENT', v_size_type, v_size_kg,
    v_delta_sacks, v_delta_loose, 'ADJUSTMENT', v_reason, v_profile_id
  );

  perform public.write_audit(
    v_profile_id, 'INVENTORY_ADJUSTED', 'inventory_balances', v_bal.id,
    jsonb_build_object('full_sacks', v_old_sacks, 'loose_kg', v_old_loose),
    jsonb_build_object('full_sacks', v_new_sacks, 'loose_kg', v_new_loose),
    jsonb_build_object(
      'rice_product_id', v_product_id,
      'sack_size_type', v_size_type,
      'sack_size_kg', v_size_kg,
      'delta_sacks', v_delta_sacks,
      'delta_loose_kg', v_delta_loose,
      'reason', v_reason,
      'notes', v_notes
    )
  );

  return jsonb_build_object(
    'rice_product_id', v_product_id,
    'sack_size_type', v_size_type,
    'sack_size_kg', v_size_kg,
    'full_sacks_before', v_old_sacks,
    'full_sacks_after', v_new_sacks,
    'loose_kg_before', v_old_loose,
    'loose_kg_after', v_new_loose,
    'delta_sacks', v_delta_sacks,
    'delta_loose_kg', v_delta_loose
  );
end;
$$;

comment on function public.adjust_inventory(jsonb) is
  'Sets the counted stock level for one product/size, records a STOCK_ADJUSTMENT movement and an audit entry. Requires a reason.';
