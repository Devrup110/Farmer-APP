import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export type Farmer = {
  id: string;
  full_name: string;
  phone: string;
  aadhaar_number: string | null;
  state: string;
  district: string;
  village: string | null;
  land_size_acres: number | null;
  created_at: string;
};

export type ProcurementCenter = {
  id: string;
  name: string;
  district: string;
  state: string;
  address: string;
  open_time: string;
  close_time: string;
  capacity_per_slot: number;
};

export type Booking = {
  id: string;
  farmer_id: string;
  center_id: string;
  booking_date: string;
  slot_time: string;
  crop_type: string;
  quantity_quintals: number;
  status: string;
  queue_position: number | null;
  sms_opt_in: boolean;
  created_at: string;
  center?: ProcurementCenter;
};

export type Procurement = {
  id: string;
  farmer_id: string;
  booking_id: string | null;
  center_id: string;
  crop_type: string;
  quantity_quintals: number;
  grade: string | null;
  moisture_percent: number | null;
  status: string;
  registered_at: string;
  checked_in_at: string | null;
  quality_checked_at: string | null;
  payment_released_at: string | null;
  center?: ProcurementCenter;
};

export type Payment = {
  id: string;
  farmer_id: string;
  procurement_id: string;
  amount_rs: number;
  status: string;
  method: string;
  reference_number: string | null;
  created_at: string;
  expected_date: string | null;
  procurement?: Procurement;
};

export type Notification = {
  id: string;
  farmer_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};
