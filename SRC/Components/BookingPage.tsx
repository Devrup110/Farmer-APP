import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase, type ProcurementCenter } from '@/lib/supabase';
import {
  ArrowRight, CalendarDays, Check, ChevronRight, Loader2, MapPin,
  PackageCheck, Sprout, Wheat, X, Bell,
} from 'lucide-react';

type Slot = { time: string; remaining: number; popular?: boolean };

const cropTypes = ['Wheat', 'Rice', 'Mustard', 'Maize', 'Barley', 'Gram', 'Soybean'];
const slotTimes = ['08:00 AM', '09:30 AM', '11:00 AM', '01:30 PM', '03:00 PM'];

export default function BookingPage() {
  const { farmer } = useAuth();
  const [centers, setCenters] = useState<ProcurementCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('09:30 AM');
  const [cropType, setCropType] = useState('Wheat');
  const [quantity, setQuantity] = useState('24');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('procurement_centers').select('*');
      setCenters(data ?? []);
      if (data && data.length > 0) setSelectedCenter(data[0].id);
      setLoading(false);
    })();
  }, []);

  const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!selectedDate) setSelectedDate(getTomorrow());
  }, []);

  const getRemaining = (slotTime: string): number => {
    const center = centers.find((c) => c.id === selectedCenter);
    if (!center) return 30;
    return Math.max(0, center.capacity_per_slot - Math.floor(Math.random() * 15));
  };

  const handleSubmit = async () => {
    if (!farmer || !selectedCenter || !selectedDate) return;
    setError('');
    setSubmitting(true);
    try {
      const center = centers.find((c) => c.id === selectedCenter);
      const queuePos = Math.floor(Math.random() * 12) + 1;

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          farmer_id: farmer.id,
          center_id: selectedCenter,
          booking_date: selectedDate,
          slot_time: selectedSlot,
          crop_type: cropType,
          quantity_quintals: parseFloat(quantity),
          status: 'confirmed',
          queue_position: queuePos,
          sms_opt_in: smsOptIn,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      await supabase.from('procurements').insert({
        farmer_id: farmer.id,
        booking_id: booking.id,
        center_id: selectedCenter,
        crop_type: cropType,
        quantity_quintals: parseFloat(quantity),
        status: 'registered',
      });

      await supabase.from('notifications').insert({
        farmer_id: farmer.id,
        type: 'booking_confirmation',
        title: 'Slot confirmed',
        message: `Your visit to ${center?.name} on ${selectedDate} at ${selectedSlot} is confirmed. You are #${queuePos} in queue.`,
      });

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#6d9846]" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#d8ec91] text-[#3d763d]">
          <Check size={40} />
        </div>
        <h2 className="mt-6 font-serif text-3xl font-bold text-[#1d4935]">Slot confirmed!</h2>
        <p className="mt-2 max-w-md text-center text-[15px] text-[#718176]">
          Your visit to {centers.find((c) => c.id === selectedCenter)?.name} on{' '}
          {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })} at {selectedSlot} is booked.
        </p>
        <p className="mt-1 text-sm text-[#8a9b8e]">We'll send you an SMS when your turn is near.</p>
        <button
          onClick={() => { setSuccess(false); setQuantity('24'); }}
          className="mt-8 flex items-center gap-2 rounded-full bg-[#1d593c] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#15472f]"
        >
          Book another slot <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#1d4935] md:text-4xl">Book a procurement slot</h1>
        <p className="mt-2 text-[15px] text-[#718176]">Choose your centre, date, and time to reserve a visit.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-[#fde8e4] px-4 py-3 text-sm text-[#c14a30]">
          <X size={16} /> {error}
        </div>
      )}

      {/* Step 1: Centre */}
      <div className="rounded-[28px] border border-[#e0e7d7] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d593c] text-sm font-bold text-white">1</span>
          <h2 className="font-serif text-xl font-bold text-[#234e38]">Select your procurement centre</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {centers.map((center) => (
            <button
              key={center.id}
              onClick={() => setSelectedCenter(center.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                selectedCenter === center.id
                  ? 'border-[#8dad50] bg-[#eff6de] shadow-[0_0_0_3px_#eff6de]'
                  : 'border-[#e5eadf] bg-white hover:border-[#b8cf8b]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf3d2] text-[#6d9842]">
                  <PackageCheck size={18} />
                </div>
                {selectedCenter === center.id && <Check size={18} className="text-[#6d9842]" />}
              </div>
              <p className="mt-3 text-sm font-bold text-[#315741]">{center.name}</p>
              <p className="mt-1 text-xs text-[#7a897d]">{center.address}</p>
              <p className="mt-2 text-xs font-semibold text-[#6d9846]">
                Open {center.open_time} – {center.close_time} · {center.capacity_per_slot} per slot
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Date */}
      <div className="rounded-[28px] border border-[#e0e7d7] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d593c] text-sm font-bold text-white">2</span>
          <h2 className="font-serif text-xl font-bold text-[#234e38]">Choose a date</h2>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8f1] p-3">
          <CalendarDays size={20} className="text-[#679046]" />
          <input
            type="date"
            value={selectedDate}
            min={getTomorrow()}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold text-[#2d523d] outline-none"
          />
        </div>
      </div>

      {/* Step 3: Slot */}
      <div className="rounded-[28px] border border-[#e0e7d7] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d593c] text-sm font-bold text-white">3</span>
          <h2 className="font-serif text-xl font-bold text-[#234e38]">Pick a time slot</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {slotTimes.map((time, i) => {
            const remaining = getRemaining(time);
            return (
              <button
                key={time}
                onClick={() => setSelectedSlot(time)}
                className={`relative rounded-2xl border p-3 text-left transition ${
                  selectedSlot === time
                    ? 'border-[#8dad50] bg-[#eff6de] shadow-[0_0_0_3px_#eff6de]'
                    : 'border-[#e5eadf] bg-white hover:border-[#b8cf8b]'
                }`}
              >
                <p className="text-sm font-bold text-[#315741]">{time}</p>
                <p className={`mt-2 text-[11px] ${remaining < 10 ? 'text-[#c97954]' : 'text-[#7a897d]'}`}>
                  {remaining} spots left
                </p>
                {i === 1 && (
                  <span className="absolute -top-2 right-2 rounded-full bg-[#1d593c] px-2 py-0.5 text-[9px] font-bold text-white">
                    Popular
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 4: Crop details */}
      <div className="rounded-[28px] border border-[#e0e7d7] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d593c] text-sm font-bold text-white">4</span>
          <h2 className="font-serif text-xl font-bold text-[#234e38]">Crop details</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#63776a]">Crop type</span>
            <div className="flex items-center gap-3 rounded-xl border border-[#d9e2d5] bg-white px-4 py-3">
              <Wheat size={17} className="text-[#9aab8e]" />
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#234e38] outline-none"
              >
                {cropTypes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#63776a]">Quantity (quintals)</span>
            <div className="flex items-center gap-3 rounded-xl border border-[#d9e2d5] bg-white px-4 py-3">
              <Sprout size={17} className="text-[#9aab8e]" />
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className="flex-1 bg-transparent text-sm text-[#234e38] outline-none"
              />
            </div>
          </label>
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-xl border border-[#e1e9dd] bg-[#f6f8f1] p-3 text-xs text-[#617469]">
          <input
            type="checkbox"
            checked={smsOptIn}
            onChange={(e) => setSmsOptIn(e.target.checked)}
            className="h-4 w-4 accent-[#477840]"
          />
          Send me an SMS when my turn is near
        </label>
      </div>

      {/* Summary + Submit */}
      <div className="rounded-[28px] border border-[#e0e7d7] bg-[#edf3df] p-6 shadow-sm md:p-8">
        <h3 className="font-serif text-xl font-bold text-[#234e38]">Booking summary</h3>
        <div className="mt-4 space-y-2 text-sm">
          <SummaryRow label="Centre" value={centers.find((c) => c.id === selectedCenter)?.name ?? '—'} />
          <SummaryRow label="Date" value={selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
          <SummaryRow label="Time" value={selectedSlot} />
          <SummaryRow label="Crop" value={cropType} />
          <SummaryRow label="Quantity" value={`${quantity} quintals`} />
          <SummaryRow label="Est. value" value={`₹ ${(parseFloat(quantity) * 2450).toLocaleString('en-IN')}`} />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1d593c] py-3.5 text-sm font-bold text-white transition hover:bg-[#15472f] disabled:opacity-60"
        >
          {submitting ? (
            <><Loader2 size={18} className="animate-spin" /> Confirming...</>
          ) : (
            <>Confirm my slot <ArrowRight size={17} /></>
          )}
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#d4decb] pb-2">
      <span className="text-[#7a897d]">{label}</span>
      <span className="font-bold text-[#315741]">{value}</span>
    </div>
  );
}
