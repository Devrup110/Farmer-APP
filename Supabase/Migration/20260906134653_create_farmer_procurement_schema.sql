/*
# Farmer Procurement Schema

Creates the full data model for HarvestFlow — a farmer-first procurement platform.

## New Tables

1. `farmers` — extends auth.users with farmer-specific profile data
   - `id` (uuid, PK, references auth.users)
   - `full_name` (text, not null)
   - `phone` (text, not null)
   - `state` (text, not null)
   - `district` (text, not null)
   - `village` (text, nullable)
   - `land_size_acres` (numeric, nullable)
   - `created_at` (timestamptz)

2. `procurement_centers` — reference data for centers
   - `id` (uuid, PK)
   - `name` (text, not null)
   - `district` (text, not null)
   - `state` (text, not null)
   - `address` (text, not null)
   - `open_time` (text, not null)
   - `close_time` (text, not null)
   - `capacity_per_slot` (int, default 30)

3. `bookings` — slot bookings by farmers
   - `id` (uuid, PK)
   - `farmer_id` (uuid, references farmers, defaults to auth.uid())
   - `center_id` (uuid, references procurement_centers)
   - `booking_date` (date, not null)
   - `slot_time` (text, not null)
   - `crop_type` (text, not null)
   - `quantity_quintals` (numeric, not null)
   - `status` (text, default 'confirmed')
   - `queue_position` (int, nullable)
   - `sms_opt_in` (boolean, default true)
   - `created_at` (timestamptz)

4. `procurements` — tracks the procurement process
   - `id` (uuid, PK)
   - `farmer_id` (uuid, references farmers, defaults to auth.uid())
   - `booking_id` (uuid, references bookings, nullable)
   - `center_id` (uuid, references procurement_centers)
   - `crop_type` (text, not null)
   - `quantity_quintals` (numeric, not null)
   - `grade` (text, nullable)
   - `moisture_percent` (numeric, nullable)
   - `status` (text, default 'registered')
   - `registered_at` (timestamptz)
   - `checked_in_at` (timestamptz, nullable)
   - `quality_checked_at` (timestamptz, nullable)
   - `payment_released_at` (timestamptz, nullable)

5. `payments` — payment tracking
   - `id` (uuid, PK)
   - `farmer_id` (uuid, references farmers, defaults to auth.uid())
   - `procurement_id` (uuid, references procurements)
   - `amount_rs` (numeric, not null)
   - `status` (text, default 'processing')
   - `method` (text, default 'bank_transfer')
   - `reference_number` (text, nullable)
   - `created_at` (timestamptz)
   - `expected_date` (date, nullable)

6. `notifications` — in-app and SMS notification log
   - `id` (uuid, PK)
   - `farmer_id` (uuid, references farmers, defaults to auth.uid())
   - `type` (text, not null) — queue_update, payment_update, booking_confirmation, slot_reminder
   - `title` (text, not null)
   - `message` (text, not null)
   - `is_read` (boolean, default false)
   - `created_at` (timestamptz)

## Security
- RLS enabled on all tables.
- `farmers`: owner-scoped CRUD (auth.uid() = id).
- `procurement_centers`: public read for all (anon + authenticated), no writes.
- `bookings`, `procurements`, `payments`, `notifications`: owner-scoped CRUD via farmer_id = auth.uid().
- All owner columns default to auth.uid() so inserts from the client succeed.
*/

-- Farmers profile table
CREATE TABLE IF NOT EXISTS farmers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  village text,
  land_size_acres numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_farmer" ON farmers;
CREATE POLICY "select_own_farmer" ON farmers FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_farmer" ON farmers;
CREATE POLICY "insert_own_farmer" ON farmers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_farmer" ON farmers;
CREATE POLICY "update_own_farmer" ON farmers FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Procurement centers (public reference data)
CREATE TABLE IF NOT EXISTS procurement_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  district text NOT NULL,
  state text NOT NULL,
  address text NOT NULL,
  open_time text NOT NULL DEFAULT '07:00',
  close_time text NOT NULL DEFAULT '18:00',
  capacity_per_slot int NOT NULL DEFAULT 30
);
ALTER TABLE procurement_centers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_centers" ON procurement_centers;
CREATE POLICY "read_centers" ON procurement_centers FOR SELECT
  TO anon, authenticated USING (true);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES farmers(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES procurement_centers(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  slot_time text NOT NULL,
  crop_type text NOT NULL,
  quantity_quintals numeric NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  queue_position int,
  sms_opt_in boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bookings" ON bookings;
CREATE POLICY "select_own_bookings" ON bookings FOR SELECT
  TO authenticated USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "insert_own_bookings" ON bookings;
CREATE POLICY "insert_own_bookings" ON bookings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "update_own_bookings" ON bookings;
CREATE POLICY "update_own_bookings" ON bookings FOR UPDATE
  TO authenticated USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "delete_own_bookings" ON bookings;
CREATE POLICY "delete_own_bookings" ON bookings FOR DELETE
  TO authenticated USING (auth.uid() = farmer_id);

-- Procurements
CREATE TABLE IF NOT EXISTS procurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES farmers(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  center_id uuid NOT NULL REFERENCES procurement_centers(id) ON DELETE CASCADE,
  crop_type text NOT NULL,
  quantity_quintals numeric NOT NULL,
  grade text,
  moisture_percent numeric,
  status text NOT NULL DEFAULT 'registered',
  registered_at timestamptz DEFAULT now(),
  checked_in_at timestamptz,
  quality_checked_at timestamptz,
  payment_released_at timestamptz
);
ALTER TABLE procurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_procurements" ON procurements;
CREATE POLICY "select_own_procurements" ON procurements FOR SELECT
  TO authenticated USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "insert_own_procurements" ON procurements;
CREATE POLICY "insert_own_procurements" ON procurements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "update_own_procurements" ON procurements;
CREATE POLICY "update_own_procurements" ON procurements FOR UPDATE
  TO authenticated USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES farmers(id) ON DELETE CASCADE,
  procurement_id uuid NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
  amount_rs numeric NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  method text NOT NULL DEFAULT 'bank_transfer',
  reference_number text,
  created_at timestamptz DEFAULT now(),
  expected_date date
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "insert_own_payments" ON payments;
CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "update_own_payments" ON payments;
CREATE POLICY "update_own_payments" ON payments FOR UPDATE
  TO authenticated USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES farmers(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = farmer_id);

-- Insert seed procurement centers
INSERT INTO procurement_centers (name, district, state, address, open_time, close_time, capacity_per_slot)
SELECT 'Karnal Grain Procurement Centre', 'Karnal', 'Haryana', 'Sector 12, Industrial Area, Karnal', '07:00', '18:00', 30
WHERE NOT EXISTS (SELECT 1 FROM procurement_centers WHERE name = 'Karnal Grain Procurement Centre');

INSERT INTO procurement_centers (name, district, state, address, open_time, close_time, capacity_per_slot)
SELECT 'Kurukshetra Mandi Board', 'Kurukshetra', 'Haryana', 'Pipli, Kurukshetra', '07:00', '17:00', 25
WHERE NOT EXISTS (SELECT 1 FROM procurement_centers WHERE name = 'Kurukshetra Mandi Board');

INSERT INTO procurement_centers (name, district, state, address, open_time, close_time, capacity_per_slot)
SELECT 'Hisar Procurement Hub', 'Hisar', 'Haryana', 'Model Town, Hisar', '08:00', '18:00', 35
WHERE NOT EXISTS (SELECT 1 FROM procurement_centers WHERE name = 'Hisar Procurement Hub');

INSERT INTO procurement_centers (name, district, state, address, open_time, close_time, capacity_per_slot)
SELECT 'Rohtak Grain Market', 'Rohtak', 'Haryana', 'Bahadurgarh Road, Rohtak', '07:00', '17:00', 28
WHERE NOT EXISTS (SELECT 1 FROM procurement_centers WHERE name = 'Rohtak Grain Market');
