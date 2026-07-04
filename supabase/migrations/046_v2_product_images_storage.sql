-- Create public product-images storage bucket
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist (idempotent)
drop policy if exists "product_images_insert" on storage.objects;
drop policy if exists "product_images_select" on storage.objects;
drop policy if exists "product_images_update" on storage.objects;
drop policy if exists "product_images_delete" on storage.objects;

-- Authenticated users can upload / replace images
create policy "product_images_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');

-- Anyone (including anon) can view product images (public bucket)
create policy "product_images_select"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Authenticated users can overwrite (upsert) images
create policy "product_images_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images');

-- Authenticated users can delete images
create policy "product_images_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images');
