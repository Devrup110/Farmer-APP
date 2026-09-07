import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase, type Booking, type Procurement, type Payment, type Notification } from '@/lib/supabase';
import {
  ArrowRight, Bell, CalendarDays, Check, ChevronRight, Clock3,
  CreditCard, FileText, Leaf, MapPin, PackageCheck, Truck, Wheat,
} from 'lucide-react';

type Props = {
  onNavigate: (page: string) => void;
  onOpenNotifications: () => void;
};

export default function OverviewPage({ onNavigate, onOpenNotifications }: Props) {
  const { farmer } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!farmer) return;
    (async () => {
      const [{ data: b }, { data: p }, { data: pay }, { data: n }] = await Promise.all([
        supabase.from('bookings').select('*, center:procurement_centers(*)').eq('farmer_id', farmer.id).order('created_at', { ascending: false }),
        supabase.from('procurements').select('*, center:procurement_centers(*)').eq('farmer_id', farmer.id).order('registered_at', { ascending: false }),
        supabase.from('payments').select('*, procurement:procurements(*)').eq('farmer_id', farmer.id).order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('farmer_id', farmer.id).order('created_at', { ascending: false }).limit(5),
      ]);
      setBookings(b ?? []);
      setProcurements(p ?? []);
      setPayments(pay ?? []);
      setNotifications(n ?? []);
    })();
  }, [farmer]);

  const upcomingBooking = bookings.find((b) => b.status === 'confirmed');
  const activeProcurement = procurements.find((p) => p.status !== 'completed' && p.status !== 'payment_released');
  const latestPayment = payments[0];
  const queuePosition = upcomingBooking?.queue_position ?? null;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#88a453]">
            <span className="h-2 w-2 rounded-full bg-[#9fbe57]" /> {today}
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight text-[#1d4935] md:text-[46px]">
            Good day, {farmer?.full_name?.split(' ')[0] ?? 'Farmer'}.
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-[#718176]">
            Your harvest journey, made simple. Check your place in line, book a visit, and get paid without the waiting.
          </p>
        </div>
        <button
          onClick={() => onNavigate('Book a slot')}
          className="group flex w-fit items-center gap-3 rounded-full bg-[#1d593c] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_-12px_#1d593c] transition hover:-translate-y-0.5 hover:bg-[#15472f]"
        >
          <CalendarDays size={18} /> Book a procurement slot
          <ArrowRight size={17} className="transition group-hover:translate-x-1" />
        </button>
      </div>

      {/* Stats row */}
      <section className="grid gap-5 xl:grid-cols-[1.65fr_1fr_1fr]">
        {/* Queue card */}
        <div className="relative min-h-[280px] overflow-hidden rounded-[28px] bg-[#214d36] p-7 text-white shadow-sm md:p-9">
          <img
            src="https://images.pexels.com/photos/7631692/pexels-photo-7631692.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            alt="Wheat field"
            className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#173c2a] via-[#214d36]/85 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#cbe271]/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#d9ec9a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d9ec9a]" /> Live queue update
              </span>
              <h2 className="mt-5 max-w-sm font-serif text-3xl font-bold leading-tight md:text-[36px]">
                {queuePosition
                  ? `You are #${queuePosition} in line`
                  : 'No active queue'}
              </h2>
              {upcomingBooking && (
                <p className="mt-2 text-sm text-[#c6d7c9]">
                  at {upcomingBooking.center?.name ?? 'your centre'} · {upcomingBooking.slot_time}
                </p>
              )}
            </div>
            <div className="mt-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-bold tracking-tight text-[#d8ec8e]">
                  {queuePosition ?? '—'}
                </p>
                <p className="mt-1 text-xs font-medium text-[#c6d7c9]">farmers ahead of you</p>
              </div>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-[72%] rounded-full bg-[#cbe271]" />
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">~ {queuePosition ? queuePosition * 5 : 0} min</p>
                <p className="text-xs text-[#c6d7c9]">estimated wait</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current procurement */}
        <div className="rounded-[28px] border border-[#e0e7d7] bg-white p-7 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf3d2] text-[#6d9842]">
              <Wheat size={23} />
            </div>
            <span className="rounded-full bg-[#ecf6e7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5c9756]">
              {activeProcurement ? activeProcurement.status.replace(/_/g, ' ') : 'No data'}
            </span>
          </div>
          <p className="mt-6 text-sm font-medium text-[#829086]">Current procurement</p>
          <h3 className="mt-1 font-serif text-[27px] font-bold text-[#234e38]">
            {activeProcurement ? `${activeProcurement.crop_type} · ${activeProcurement.quantity_quintals} qtl` : 'No active procurement'}
          </h3>
          <div className="mt-7 flex items-end justify-between">
            <div>
              <p className="text-xs text-[#829086]">Expected value</p>
              <p className="mt-1 text-xl font-bold text-[#1d593c]">
                ₹ {activeProcurement ? (activeProcurement.quantity_quintals * 2450).toLocaleString('en-IN') : '0'}
              </p>
            </div>
            <button onClick={() => onNavigate('My procurements')} className="flex items-center gap-1 text-xs font-bold text-[#659144]">
              View details <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Last payment */}
        <div className="rounded-[28px] border border-[#e0e7d7] bg-[#edf3df] p-7 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#668e43]">
              <CreditCard size={22} />
            </div>
            <span className="rounded-full bg-[#fff9e3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#a68435]">
              {latestPayment ? latestPayment.status : 'No data'}
            </span>
          </div>
          <p className="mt-6 text-sm font-medium text-[#829086]">Last payment</p>
          <h3 className="mt-1 font-serif text-[27px] font-bold text-[#234e38]">
            ₹ {latestPayment ? latestPayment.amount_rs.toLocaleString('en-IN') : '0'}
          </h3>
          <div className="mt-7 flex items-center gap-2 text-xs font-semibold text-[#687c6c]">
            {latestPayment ? (
              <><Check size={15} className="text-[#78a34a]" /> Expected by {latestPayment.expected_date ?? 'TBD'}</>
            ) : (
              'No payments yet'
            )}
          </div>
        </div>
      </section>

      {/* Booking + Journey */}
      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Quick booking */}
        <div className="rounded-[28px] border border-[#e0e7d7] bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#86a052]">Plan your visit</p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-[#234e38]">Reserve a time that works for you</h2>
              <p className="mt-2 text-sm text-[#79877d]">Avoid the rush. Slots are updated every 15 minutes.</p>
            </div>
            <MapPin className="mt-1 text-[#98b35f]" size={22} />
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#f6f8f1] p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#679046]">
              <PackageCheck size={18} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[#7a897d]">Your centre</p>
              <p className="text-sm font-bold text-[#2d523d]">
                {upcomingBooking?.center?.name ?? 'No centre selected'}
              </p>
            </div>
            <button onClick={() => onNavigate('Book a slot')} className="text-xs font-bold text-[#6a9348]">Change</button>
          </div>
          <button
            onClick={() => onNavigate('Book a slot')}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d9ed91] py-3.5 text-sm font-bold text-[#234a34] transition hover:bg-[#cbe277]"
          >
            Choose a slot <ArrowRight size={16} />
          </button>
        </div>

        {/* Journey timeline */}
        <div className="rounded-[28px] border border-[#e0e7d7] bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#86a052]">Harvest journey</p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-[#234e38]">
                {activeProcurement ? `${activeProcurement.crop_type} procurement` : 'No active journey'}
              </h2>
            </div>
            <button onClick={() => onNavigate('My procurements')} className="text-xs font-bold text-[#6a9348]">Full view</button>
          </div>
          <div className="mt-7 space-y-6">
            <JourneyStep icon={Check} title="Registration complete" detail="Farmer ID verified" done />
            <JourneyStep
              icon={Truck}
              title="Delivery checked in"
              detail={activeProcurement?.checked_in_at ? 'Received at centre' : 'Awaiting check-in'}
              done={!!activeProcurement?.checked_in_at}
            />
            <JourneyStep
              icon={FileText}
              title="Quality assessment"
              detail={activeProcurement?.quality_checked_at ? 'Sample reviewed' : 'Sample is being reviewed'}
              active={!activeProcurement?.quality_checked_at && !!activeProcurement}
              done={!!activeProcurement?.quality_checked_at}
            />
            <JourneyStep
              icon={CreditCard}
              title="Payment released"
              detail={activeProcurement?.payment_released_at ? 'Payment sent' : 'Usually within 48 hours'}
            />
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid gap-5 md:grid-cols-3">
        <QuickAction
          icon={Bell}
          title="Stay in the loop"
          detail={`${unreadCount} unread update${unreadCount !== 1 ? 's' : ''}`}
          action="View alerts"
          onClick={onOpenNotifications}
        />
        <QuickAction
          icon={Leaf}
          title="Centre information"
          detail="Hours, directions and documents"
          action="View centre"
          onClick={() => onNavigate('Book a slot')}
        />
        <QuickAction
          icon={CreditCard}
          title="Payment history"
          detail="Track all your procurements"
          action="View payments"
          onClick={() => onNavigate('Payments')}
        />
      </section>
    </div>
  );
}

function JourneyStep({
  icon: Icon, title, detail, done, active,
}: {
  icon: typeof Check; title: string; detail: string; done?: boolean; active?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        done
          ? 'bg-[#d8ec91] text-[#3d763d]'
          : active
            ? 'border-2 border-[#9fbc62] bg-[#f2f7e6] text-[#6c944c]'
            : 'border border-[#dce5d9] bg-white text-[#a8b4a9]'
      }`}>
        <Icon size={16} />
      </div>
      <div className="pt-0.5">
        <p className={`text-sm font-bold ${active ? 'text-[#315d3e]' : 'text-[#4e6958]'}`}>
          {title}
          {active && (
            <span className="ml-2 rounded-full bg-[#fff2d5] px-2 py-1 text-[9px] font-bold uppercase text-[#a17e3b]">
              In progress
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-[#89968c]">{detail}</p>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon, title, detail, action, onClick,
}: {
  icon: typeof Bell; title: string; detail: string; action: string; onClick: () => void;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-[24px] border border-[#e0e7d7] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef5df] text-[#6d9846]">
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-[#355842]">{title}</p>
        <p className="mt-1 text-xs text-[#849087]">{detail}</p>
      </div>
      <button onClick={onClick} className="flex items-center gap-1 text-xs font-bold text-[#6a9348]">
        {action} <ChevronRight size={14} />
      </button>
    </div>
  );
}
