-- ============================================================
-- Add Admin User to LingapApu Database
-- Run this in your Supabase project's SQL Editor
-- ============================================================

INSERT INTO public.users (
  name,
  username,
  password,
  role,
  contact,
  email
) VALUES (
  'System Administrator',
  'admin',
  'Admin@123',
  'admin',
  '09XX XXX XXXX',
  'admin@lingapapu.local'
) ON CONFLICT (username) DO NOTHING;

-- Verify the insertion
SELECT id, name, username, role, date_added FROM public.users WHERE role = 'admin' ORDER BY date_added DESC LIMIT 5;
