-- ============================================================
-- LingapApu – Supabase Database Schema
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- ── 1. Users (admin / osca / merchant / senior login accounts) ──
CREATE TABLE IF NOT EXISTS public.users (
  id          TEXT PRIMARY KEY DEFAULT ('USR-' || gen_random_uuid()::text),
  name        TEXT,
  username    TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin','osca','merchant','senior')),
  senior_id   TEXT,          -- for role = 'senior': links to seniors.id
  contact     TEXT,
  email       TEXT,
  date_added  TEXT DEFAULT (CURRENT_DATE::TEXT),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Seniors (beneficiary profiles) ──
CREATE TABLE IF NOT EXISTS public.seniors (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  birth             TEXT,
  age               INTEGER,
  gender            TEXT,
  contact           TEXT,
  address           TEXT,
  username          TEXT,
  password          TEXT,
  benefits          JSONB DEFAULT '[]'::jsonb,
  notes             TEXT,
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  status            TEXT DEFAULT 'active',
  photo             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Transactions ──
CREATE TABLE IF NOT EXISTS public.transactions (
  id          TEXT PRIMARY KEY DEFAULT ('TXN-' || gen_random_uuid()::text),
  senior_id   TEXT REFERENCES public.seniors(id) ON DELETE SET NULL,
  senior_name TEXT,
  timestamp   TIMESTAMPTZ DEFAULT NOW(),
  type        TEXT,
  amount      TEXT,
  note        TEXT,
  merchant_id TEXT,
  scan_date   TEXT,
  status      TEXT DEFAULT 'Completed',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Benefits Programs ──
CREATE TABLE IF NOT EXISTS public.benefits (
  id          TEXT PRIMARY KEY DEFAULT ('BEN-' || gen_random_uuid()::text),
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  amount      NUMERIC DEFAULT 0,
  frequency   TEXT,
  active      BOOLEAN DEFAULT TRUE,
  eligibility TEXT,
  coverage    TEXT,
  date_created TEXT DEFAULT (CURRENT_DATE::TEXT),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Age-Based Benefits (Birthday tiers, special programs) ──
CREATE TABLE IF NOT EXISTS public.age_benefits (
  id           TEXT PRIMARY KEY DEFAULT ('AGEBEN-' || gen_random_uuid()::text),
  benefit_key  TEXT UNIQUE NOT NULL,   -- e.g. '90', '91', '100', 'medical', 'burial', 'pension'
  age          INTEGER,                -- numeric age (NULL for non-age entries)
  amount       NUMERIC DEFAULT 0,
  description  TEXT,
  benefit_type TEXT DEFAULT 'birthday' CHECK (benefit_type IN ('birthday','special')),
  is_numeric   BOOLEAN DEFAULT TRUE,
  active       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. Pending Registrations ──
CREATE TABLE IF NOT EXISTS public.pending_registrations (
  id           TEXT PRIMARY KEY DEFAULT ('SC-' || gen_random_uuid()::text),
  name         TEXT NOT NULL,
  age          INTEGER,
  birthday     TEXT,
  contact      TEXT,
  address      TEXT,
  gender       TEXT,
  photo        TEXT,
  notes        TEXT,
  username     TEXT,
  password     TEXT,
  birth        TEXT,
  date_applied TEXT DEFAULT (CURRENT_DATE::TEXT),
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row-Level Security (RLS)
-- The app uses its own username/password auth against the users
-- table, so we grant full anon access here. Tighten later if
-- you add Supabase Auth.
-- ============================================================
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seniors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_benefits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

-- Allow full CRUD via the anon key
CREATE POLICY "anon_all" ON public.users                FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.seniors              FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.transactions         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.benefits             FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.age_benefits         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.pending_registrations FOR ALL TO anon USING (true) WITH CHECK (true);

-- Add username/password columns to pending_registrations if running on an existing DB
ALTER TABLE public.pending_registrations ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.pending_registrations ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.pending_registrations ADD COLUMN IF NOT EXISTS birth    TEXT;

-- ============================================================
-- Seed Data  (run once after creating tables)
-- ============================================================

-- Default admin / osca / merchant users
INSERT INTO public.users (id, name, username, password, role, email) VALUES
  ('USR-ADMIN', 'Administrator', 'admin', '1234', 'admin', 'admin@floridablanca.gov.ph'),
  ('USR-OSCA',  'OSCA Staff',    'osca',  '1234', 'osca',  'osca@floridablanca.gov.ph'),
  ('USR-MARIA', 'Maria Santos',  'maria', '1234', 'osca',  'maria@floridablanca.gov.ph'),
  ('USR-MERCH', 'Merchant',      'merchant', '1234', 'merchant', 'merchant@example.com'),
  ('USR-STORE1','Store 1',       'store1',   '1234', 'merchant', 'store1@example.com'),
  ('USR-PHARM', 'Pharmacy',      'pharmacy', '1234', 'merchant', 'pharmacy@example.com')
ON CONFLICT (username) DO NOTHING;

-- Default Benefits Programs
INSERT INTO public.benefits (id, name, description, amount, frequency, active, eligibility, coverage) VALUES
  ('BEN001','Monthly Pension','Monthly financial assistance for senior citizens aged 60 and above',1500,'Monthly',true,'All registered senior citizens','Cash assistance for daily living expenses'),
  ('BEN002','Medical Subsidy','Comprehensive medical and healthcare financial assistance program',5000,'Quarterly',true,'Seniors with medical needs','Hospital bills, medications, laboratory tests, consultations'),
  ('BEN003','Transport Allowance','Transportation support for seniors to access government services',500,'Monthly',true,'All active seniors','Public transport fare, tricycle/jeep subsidy'),
  ('BEN004','Birthday Gift','Special birthday cash gift for senior citizens',1000,'Yearly',true,'Birthday celebrants (birth month)','One-time birthday cash assistance'),
  ('BEN005','Grocery Voucher','Grocery assistance vouchers for basic food items and necessities',2000,'Quarterly',true,'All registered seniors','Rice, canned goods, toiletries, basic commodities'),
  ('BEN006','20% Senior Discount','Mandatory 20% discount on purchases and services nationwide',0,'Always Available',true,'All senior citizens with valid ID','Restaurants, drugstores, groceries, hotels, transportation, recreation'),
  ('BEN007','Free Medical Checkup','Regular health monitoring and preventive care services',0,'Monthly',true,'All registered seniors','Blood pressure, blood sugar, general consultation, vitamins'),
  ('BEN008','Dental Services','Basic dental care and oral health services',0,'Bi-Annual',true,'All seniors needing dental care','Cleaning, extraction, dentures subsidy'),
  ('BEN009','Eye Care Assistance','Vision care and eyeglasses support program',1500,'Yearly',true,'Seniors needing vision correction','Eye examination, prescription eyeglasses, cataract screening'),
  ('BEN010','Emergency Assistance Fund','Immediate financial aid for urgent needs and emergencies',3000,'As Needed',true,'Seniors facing emergencies','Medical emergencies, natural disasters, fire, hospitalization')
ON CONFLICT (name) DO NOTHING;

-- Default Age Benefits
INSERT INTO public.age_benefits (id, benefit_key, age, amount, description, benefit_type, is_numeric) VALUES
  ('AGEBEN-001', '90',      90,  3000,   'Birthday cake and cheque',                      'birthday', true),
  ('AGEBEN-002', '91',      91,  5000,   'Birthday cake and cheque',                      'birthday', true),
  ('AGEBEN-003', '92',      92,  7000,   'Birthday cake and cheque',                      'birthday', true),
  ('AGEBEN-004', '93',      93,  8500,   'Birthday cake and cheque',                      'birthday', true),
  ('AGEBEN-005', '94',      94,  10000,  'Birthday incentive for ages 94-99',             'birthday', true),
  ('AGEBEN-006', '100',     100, 100000, 'Centenarian Award - One-time',                  'birthday', true),
  ('AGEBEN-007', 'medical', NULL, 0,     'Healthcare support and medical services',       'special',  false),
  ('AGEBEN-008', 'burial',  NULL, 0,     'Financial support for funeral services',        'special',  false),
  ('AGEBEN-009', 'pension', NULL, 0,     'Limited slots (165 total, 1 per barangay yearly)', 'special', false)
ON CONFLICT (benefit_key) DO NOTHING;
