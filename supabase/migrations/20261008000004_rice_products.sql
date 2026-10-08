-- 004 Rice products, product images, and storage bucket
-- Prices are never stored on products: prices are entered per transaction.

create table public.rice_products (
  id uuid primary key default gen_random_uuid(),
  rice_name text not null,
  rice_type text,
  variety text,
  image_url text,
  low_stock_threshold numeric(14,3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rice_products_low_stock_threshold_check check (low_stock_threshold >= 0),
  constraint rice_products_rice_name_not_blank check (length(trim(rice_name)) > 0)
);

-- Same name+type+variety must not be duplicated (NULLs treated as empty)
create unique index uq_rice_products_identity
  on public.rice_products (rice_name, coalesce(rice_type, ''), coalesce(variety, ''));

create index idx_rice_products_active on public.rice_products (is_active);

create trigger trg_rice_products_updated_at before update on public.rice_products
  for each row execute function public.set_updated_at();

create table public.rice_product_images (
  id uuid primary key default gen_random_uuid(),
  rice_product_id uuid not null references public.rice_products(id) on delete cascade,
  storage_path text not null,
  public_url text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint uq_rice_product_images_path unique (rice_product_id, storage_path)
);

-- Only one primary image per rice product
create unique index uq_rice_product_images_primary
  on public.rice_product_images (rice_product_id)
  where is_primary;

-- ---------------------------------------------------------------------------
-- Storage bucket for rice product images
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rice-images',
  'rice-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "rice images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'rice-images');

create policy "rice images upload for inventory managers"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'rice-images' and public.has_permission('inventory.adjust'));

create policy "rice images update for inventory managers"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'rice-images' and public.has_permission('inventory.adjust'));

create policy "rice images delete for inventory managers"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'rice-images' and public.has_permission('inventory.adjust'));
