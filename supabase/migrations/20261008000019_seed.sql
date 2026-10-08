-- 019 Seed: product catalog and system setting defaults (no business/transaction data)

insert into public.rice_products (rice_name, rice_type, variety, low_stock_threshold)
values
  ('Princess Bea', 'Milled Rice', 'Princess Bea', 10),
  ('Hasmin Blue', 'Milled Rice', 'Hasmin Blue', 10),
  ('Dinorado', 'Milled Rice', 'Dinorado', 10)
on conflict (rice_name, coalesce(rice_type, ''), coalesce(variety, ''))
do nothing;

insert into public.system_settings (setting_key, setting_value)
values
  ('company', jsonb_build_object(
    'company_name', 'Brick Eight Trading Inc.',
    'currency', 'PHP',
    'currency_symbol', '₱',
    'date_format', 'YYYY-MM-DD',
    'timezone', 'Asia/Manila'
  )),
  ('pos', jsonb_build_object(
    'low_stock_threshold', 10,
    'allow_negative_stock', false,
    'require_customer_name_on_credit', true
  )),
  ('inventory', jsonb_build_object(
    'sack_sizes', jsonb_build_array(
      jsonb_build_object('type', '25KG', 'kg', 25),
      jsonb_build_object('type', '50KG', 'kg', 50),
      jsonb_build_object('type', 'OTHER', 'kg', null)
    ),
    'rejected_sack_flow', 'RETURN_TO_STOCK'
  )),
  ('credits', jsonb_build_object(
    'max_outstanding_amount', null,
    'overpayment_blocked', true
  ))
on conflict (setting_key) do nothing;
