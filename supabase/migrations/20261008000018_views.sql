-- 018 Reporting and dashboard views
-- All views use security_invoker so the caller's RLS policies still apply.

create or replace view public.v_current_rice_inventory
with (security_invoker = true) as
select
  b.id,
  b.rice_product_id,
  p.rice_name,
  p.rice_type,
  p.variety,
  p.image_url,
  p.low_stock_threshold,
  p.is_active,
  b.sack_size_type,
  b.sack_size_kg,
  b.full_sacks,
  b.loose_kg,
  b.rejected_sacks,
  case
    when b.full_sacks = 0 and b.loose_kg = 0 then 'OUT_OF_STOCK'
    when p.low_stock_threshold > 0 and b.full_sacks <= p.low_stock_threshold then 'LOW_STOCK'
    else 'IN_STOCK'
  end as stock_status,
  b.created_at,
  b.updated_at
from public.inventory_balances b
join public.rice_products p on p.id = b.rice_product_id;

create or replace view public.v_palay_inventory
with (security_invoker = true) as
select
  b.id,
  b.rice_product_id,
  p.rice_name,
  p.variety,
  b.quantity_kg,
  case
    when b.quantity_kg = 0 then 'OUT_OF_STOCK'
    when p.low_stock_threshold > 0 and b.quantity_kg <= p.low_stock_threshold then 'LOW_STOCK'
    else 'IN_STOCK'
  end as stock_status,
  b.created_at,
  b.updated_at
from public.palay_inventory_balances b
join public.rice_products p on p.id = b.rice_product_id;

create or replace view public.v_inventory_movements
with (security_invoker = true) as
select
  m.id,
  m.rice_product_id,
  p.rice_name,
  m.movement_type,
  m.sack_size_type,
  m.sack_size_kg,
  m.full_sacks_change,
  m.loose_kg_change,
  m.rejected_sacks_change,
  m.reference_type,
  m.reference_id,
  m.notes,
  m.created_by,
  pr.full_name as created_by_name,
  m.created_at
from public.inventory_movements m
join public.rice_products p on p.id = m.rice_product_id
left join public.profiles pr on pr.id = m.created_by;

-- Sales aggregated per Philippine business day
create or replace view public.v_sales_summary
with (security_invoker = true) as
select
  (s.sale_date at time zone 'Asia/Manila')::date as business_date,
  count(*) as transactions,
  sum(s.subtotal) as subtotal,
  sum(s.discount_amount) as discount_amount,
  sum(s.total_amount) as total_amount,
  sum(s.amount_paid) as amount_paid,
  sum(s.balance) as outstanding_balance,
  count(*) filter (where s.balance > 0) as credit_sales,
  sum(s.total_amount) filter (where s.balance > 0) as credit_amount,
  count(*) filter (where s.payment_status = 'PAID') as paid_sales
from public.sales s
where s.status = 'COMPLETED'
group by 1;

create or replace view public.v_delivery_summary
with (security_invoker = true) as
select
  (d.delivery_date at time zone 'Asia/Manila')::date as business_date,
  count(*) as transactions,
  sum(d.total_amount) as total_amount,
  sum(d.amount_paid) as amount_paid,
  sum(d.balance) as outstanding_balance,
  count(*) filter (where d.balance > 0) as unpaid_deliveries
from public.deliveries d
where d.status = 'COMPLETED'
group by 1;

create or replace view public.v_reseller_transfer_summary
with (security_invoker = true) as
select
  (t.transfer_date at time zone 'Asia/Manila')::date as business_date,
  count(*) as transactions,
  sum(t.total_amount) as total_amount,
  sum(t.amount_paid) as amount_paid,
  sum(t.balance) as outstanding_balance,
  count(*) filter (where t.balance > 0) as credit_transfers
from public.reseller_transfers t
where t.status = 'COMPLETED'
group by 1;

create or replace view public.v_credit_balances
with (security_invoker = true) as
select
  c.id,
  c.credit_type,
  c.source_transaction_type,
  c.source_transaction_id,
  c.party_name,
  c.original_amount,
  c.amount_paid,
  c.balance,
  c.status,
  coalesce(s.transaction_number, t.transaction_number) as transaction_number,
  coalesce(s.sale_date, t.transfer_date) as transaction_date,
  c.created_at,
  c.updated_at
from public.credits c
left join public.sales s
  on c.source_transaction_type = 'SALE' and s.id = c.source_transaction_id
left join public.reseller_transfers t
  on c.source_transaction_type = 'TRANSFER' and t.id = c.source_transaction_id;

create or replace view public.v_rebagging_history
with (security_invoker = true) as
select
  rt.id,
  rt.transaction_number,
  rt.rebagging_type,
  rt.created_at as rebagging_date,
  rt.notes,
  rt.processed_by,
  pr.full_name as processed_by_name,
  ri.source_rice_product_id,
  sp.rice_name as source_rice_name,
  ri.source_sack_size_type,
  ri.source_sack_size_kg,
  ri.source_sacks,
  ri.source_kg,
  ri.destination_rice_product_id,
  dp.rice_name as destination_rice_name,
  ri.destination_sack_size_type,
  ri.destination_sack_size_kg,
  ri.destination_sacks,
  ri.destination_kg,
  ri.destination_loose_kg,
  ri.loss_kg,
  ri.loss_reason
from public.rebagging_transactions rt
left join public.rebagging_items ri on ri.rebagging_transaction_id = rt.id
left join public.rice_products sp on sp.id = ri.source_rice_product_id
left join public.rice_products dp on dp.id = ri.destination_rice_product_id
left join public.profiles pr on pr.id = rt.processed_by;

create or replace view public.v_palay_conversions
with (security_invoker = true) as
select
  pc.id,
  pc.transaction_number,
  pc.created_at as conversion_date,
  pc.source_rice_product_id,
  sp.rice_name as source_rice_name,
  pc.source_variety,
  pc.palay_input_kg,
  pc.destination_rice_product_id,
  dp.rice_name as destination_rice_name,
  pc.destination_sack_size_type,
  pc.destination_sack_size_kg,
  pc.rice_output_sacks,
  pc.rice_output_kg,
  pc.yield_percentage,
  pc.loss_kg,
  pc.loss_reason,
  pc.processed_by,
  pr.full_name as processed_by_name
from public.palay_conversions pc
left join public.rice_products sp on sp.id = pc.source_rice_product_id
left join public.rice_products dp on dp.id = pc.destination_rice_product_id
left join public.profiles pr on pr.id = pc.processed_by;

-- Unified recent-transaction feed for the dashboard
create or replace view public.v_recent_transactions
with (security_invoker = true) as
select
  s.sale_date as created_at,
  'SALE'::text as kind,
  s.transaction_number,
  coalesce(s.customer_name, 'Walk-in') as party_name,
  s.total_amount,
  s.amount_paid,
  s.balance,
  s.payment_status::text as payment_status,
  s.processed_by as user_id,
  s.id as transaction_id
from public.sales s
where s.status = 'COMPLETED'
union all
select
  d.delivery_date,
  'DELIVERY',
  d.transaction_number,
  d.supplier_name,
  d.total_amount,
  d.amount_paid,
  d.balance,
  d.payment_status::text,
  d.received_by,
  d.id
from public.deliveries d
where d.status = 'COMPLETED'
union all
select
  p.receipt_date,
  'PALAY',
  p.transaction_number,
  p.farmer_name,
  p.total_amount,
  p.amount_paid,
  p.balance,
  p.payment_status::text,
  p.received_by,
  p.id
from public.palay_receipts p
where p.status = 'COMPLETED'
union all
select
  t.transfer_date,
  'TRANSFER',
  t.transaction_number,
  t.reseller_name,
  t.total_amount,
  t.amount_paid,
  t.balance,
  t.payment_status::text,
  t.confirmed_by,
  t.id
from public.reseller_transfers t
where t.status = 'COMPLETED';

create or replace view public.v_product_catalog
with (security_invoker = true) as
select
  p.id,
  p.rice_name,
  p.rice_type,
  p.variety,
  p.image_url,
  p.low_stock_threshold,
  p.is_active,
  p.created_at,
  p.updated_at,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'sack_size_type', b.sack_size_type,
        'sack_size_kg', b.sack_size_kg,
        'full_sacks', b.full_sacks,
        'loose_kg', b.loose_kg,
        'rejected_sacks', b.rejected_sacks
      )
      order by b.sack_size_kg
    ) filter (where b.id is not null),
    '[]'::jsonb
  ) as stock
from public.rice_products p
left join public.inventory_balances b on b.rice_product_id = p.id
group by p.id;
