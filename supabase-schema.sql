-- ==========================================================
-- QISAGET / NMEXMAN - SUPABASE DATABASE SCHEMA & SEED SCRIPT
-- Run this in Supabase -> SQL Editor -> New Query -> Run
-- ==========================================================

-- 1. Create 'profile' table
CREATE TABLE IF NOT EXISTS public.profile (
  id TEXT PRIMARY KEY DEFAULT 'main',
  name TEXT DEFAULT 'nmexman',
  username TEXT DEFAULT '@nmexman',
  description TEXT DEFAULT 'Geoloq',
  section_title TEXT DEFAULT 'Elaqe ve Melumat',
  footer_text TEXT DEFAULT 'nmexman · QisaGet Platforması',
  verified BOOLEAN DEFAULT true,
  verified_badge_type TEXT DEFAULT 'blue',
  avatar_url TEXT DEFAULT '/avatar.jpg',
  logo_mode TEXT DEFAULT 'image',
  monogram_text TEXT DEFAULT 'NMEXMAN',
  avatar_shape TEXT DEFAULT 'circle',
  avatar_fit TEXT DEFAULT 'cover',
  avatar_zoom NUMERIC DEFAULT 100,
  avatar_pos_x NUMERIC DEFAULT 0,
  avatar_pos_y NUMERIC DEFAULT 0,
  theme JSONB DEFAULT '{
    "presetName": "Referans Şərab",
    "bgType": "gradient",
    "bgColor": "#160206",
    "gradientStart": "#4a0a14",
    "gradientMid": "#240409",
    "gradientEnd": "#0d0103",
    "gradientAngle": 180,
    "bgImageUrl": "",
    "cardBg": "#2a0a12",
    "cardBorderColor": "#120205",
    "cardBorderWidth": 3,
    "cardRadius": 20,
    "cardRadiusPreset": "rounded",
    "cardGlassBlur": 0,
    "cardGlassOpacity": 1,
    "accentGoldColor": "#fb7185",
    "textColor": "#ffffff",
    "iconColor": "#ffffff",
    "moreIconColor": "#fda4af",
    "sectionTitleColor": "#ffffff",
    "profileNameColor": "#ffffff",
    "profileDescColor": "#fecdd3"
  }'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Backward compatibility view if 'profiles' is accessed
CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.profile;

-- 2. Create 'links' table
CREATE TABLE IF NOT EXISTS public.links (
  id TEXT PRIMARY KEY,
  section_id TEXT DEFAULT 'section-main',
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  url TEXT NOT NULL,
  icon TEXT DEFAULT 'globe',
  order_index INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Initial Seed Data (Requirement 8: live values)
INSERT INTO public.profile (
  id,
  name,
  username,
  description,
  section_title,
  footer_text,
  verified,
  verified_badge_type,
  avatar_url,
  logo_mode,
  monogram_text,
  avatar_shape,
  avatar_fit,
  avatar_zoom,
  avatar_pos_x,
  avatar_pos_y
) VALUES (
  'main',
  'nmexman',
  '@nmexman',
  'Geoloq',
  'Elaqe ve Melumat',
  'nmexman · QisaGet Platforması',
  true,
  'blue',
  '/avatar.jpg',
  'image',
  'NMEXMAN',
  'circle',
  'cover',
  100,
  0,
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  description = EXCLUDED.description,
  section_title = EXCLUDED.section_title,
  footer_text = EXCLUDED.footer_text,
  verified = EXCLUDED.verified,
  verified_badge_type = EXCLUDED.verified_badge_type;

INSERT INTO public.links (
  id,
  section_id,
  title,
  subtitle,
  url,
  icon,
  order_index,
  is_active,
  clicks
) VALUES 
(
  'link-drived',
  'section-main',
  'SÜRÜLÜB – Avtomobil Tshirti',
  'Futbolka',
  'https://drived-store.com',
  'globe',
  1,
  true,
  1
),
(
  'link-vercel',
  'section-main',
  'Vercel',
  'Lahiyeler',
  'https://vercel.com',
  'globe',
  2,
  true,
  0
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  url = EXCLUDED.url,
  icon = EXCLUDED.icon,
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- Drop old policies if existing to avoid conflicts
DROP POLICY IF EXISTS "Public profiles read access" ON public.profile;
DROP POLICY IF EXISTS "Admin profile write access" ON public.profile;
DROP POLICY IF EXISTS "Public links read access" ON public.links;
DROP POLICY IF EXISTS "Admin links write access" ON public.links;

-- Read policy: Anyone can read (visitors on live site and preview)
CREATE POLICY "Public profiles read access" ON public.profile
  FOR SELECT USING (true);

CREATE POLICY "Public links read access" ON public.links
  FOR SELECT USING (true);

-- Write policy: Only authenticated service role / backend API can insert/update/delete
CREATE POLICY "Admin profile write access" ON public.profile
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin links write access" ON public.links
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Enable Realtime Replication for instant UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile;
ALTER PUBLICATION supabase_realtime ADD TABLE public.links;

-- 6. Storage Bucket for Avatars (Public Bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old storage policies if existing
DROP POLICY IF EXISTS "Public Avatars Bucket View Access" ON storage.objects;
DROP POLICY IF EXISTS "Service Role Upload Avatars" ON storage.objects;

-- Allow public viewing of avatar files
CREATE POLICY "Public Avatars Bucket View Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow uploading to avatars bucket
CREATE POLICY "Service Role Upload Avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');
