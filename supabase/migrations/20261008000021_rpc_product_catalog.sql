-- 021 get_product_catalog(): product + stock lookup for roles that cannot
-- read rice_products directly (e.g. Secretary has no inventory.view but must
-- pick products in the POS, delivery, palay, transfer and rebagging forms).

create or replace function public.get_product_catalog()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED: You must be signed in.';
  end if;

  if not (
    public.has_permission('sales.create')
    or public.has_permission('delivery.create')
    or public.has_permission('palay.create')
    or public.has_permission('transfer.create')
    or public.has_permission('rebagging.create')
    or public.has_permission('inventory.view')
  ) then
    raise exception 'FORBIDDEN: You do not have permission to view the product catalog.';
  end if;

  return (
    select coalesce(jsonb_agg(product order by product ->> 'rice_name'), '[]'::jsonb)
    from (
      select jsonb_build_object(
        'id', p.id,
        'rice_name', p.rice_name,
        'rice_type', p.rice_type,
        'variety', p.variety,
        'image_url', p.image_url,
        'low_stock_threshold', p.low_stock_threshold,
        'stock', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'sack_size_type', b.sack_size_type,
                'sack_size_kg', b.sack_size_kg,
                'full_sacks', b.full_sacks,
                'loose_kg', b.loose_kg,
                'rejected_sacks', b.rejected_sacks
              )
              order by b.sack_size_kg
            )
            from public.inventory_balances b
            where b.rice_product_id = p.id
          ),
          '[]'::jsonb
        )
      ) as product
      from public.rice_products p
      where p.is_active
    ) products
  );
end;
$$;

comment on function public.get_product_catalog() is
  'Active rice products with current stock, readable by any role allowed to enter business transactions.';
