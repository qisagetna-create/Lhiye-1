-- ========================================================
-- Supabase Setup Script for LinkFlow / QisaGet
-- Run this in the Supabase SQL Editor (1-Click Setup)
-- ========================================================

-- 1. Create the 'profiles' database table
create table if not exists public.profiles (
  id text primary key default 'main',
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Insert initial main profile row if missing
insert into public.profiles (id, avatar_url)
values ('main', '/avatar.jpg')
on conflict (id) do nothing;

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 4. RLS Policies for 'profiles' table
-- Ziyarətçilər və hər kəs yalnız oxuya bilər (SELECT)
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Admin profil şəklini yeniləyə və əlavə edə bilər (INSERT/UPDATE)
drop policy if exists "Enable upsert for profiles" on public.profiles;
create policy "Enable upsert for profiles"
  on public.profiles for all
  using (true)
  with check (true);

-- 5. Create the public Storage Bucket 'avatars'
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 6. Storage Policies for 'avatars' bucket
-- Şəkillər ictimai (public) oxunabiləndir
drop policy if exists "Avatars are publicly accessible" on storage.objects;
create policy "Avatars are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Yükləmə (upload) icazəsi
drop policy if exists "Allow upload avatars" on storage.objects;
create policy "Allow upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars');

-- Yeniləmə (update) icazəsi
drop policy if exists "Allow update avatars" on storage.objects;
create policy "Allow update avatars"
  on storage.objects for update
  using (bucket_id = 'avatars');

-- Silmə (delete) icazəsi
drop policy if exists "Allow delete avatars" on storage.objects;
create policy "Allow delete avatars"
  on storage.objects for delete
  using (bucket_id = 'avatars');
