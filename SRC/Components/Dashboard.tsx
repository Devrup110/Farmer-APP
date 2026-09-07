import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase, type Notification } from '@/lib/supabase';
import OverviewPage from '@/Components/OverviewPage';
import BookingPage from '@/Components/BookingPage';
import ProcurementsPage from '@/Components/ProcurementsPage';
import PaymentsPage from '@/Components/PaymentsPage';
import AccountPage from '@/Components/AccountPage';
import NotificationsPanel from '@/Components/NotificationsPanel';
import {
  Bell, CalendarDays, ChevronDown, CreditCard, LogOut, Menu, PackageCheck,
  Sprout, User, X, Check, CircleHelp,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', icon: Sprout },
  { label: 'Book a slot', icon: CalendarDays },
  { label: 'My procurements', icon: PackageCheck },
  { label: 'Payments', icon: CreditCard },
  { label: 'My account', icon: User },
];

export default function Dashboard() {
  const { farmer, signOut } = useAuth();
  const [activeNav, setActiveNav] = useState('Overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!farmer) return;
    (async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', farmer.id)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    })();
  }, [farmer, showNotifications]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleNav = (page: string) => {
    setActiveNav(page);
    setMobileMenu(false);
  };

  const initials = farmer?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'F';

  return (
    <div className="min-h-screen bg-[#f6f7f1] text-[#193b2c]">
      {/* Top banner */}
      <div className="bg-[#143c2b] px-5 py-2 text-center text-[11px] font-semibold tracking-[0.14em] text-[#dfeea4]">
        PROCUREMENT SEASON IS OPEN · BOOK YOUR VISIT BEFORE ARRIVING
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#dce4d5] bg-[#f6f7f1]/95 px-5 py-4 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6">
          {/* Logo */}
          <button className="flex items-center gap-3" onClick={() => handleNav('Overview')}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#cfe56d] text-[#183b2b] shadow-sm">
              <Sprout size={24} strokeWidth={1.8} />
            </span>
            <span className="text-left">
              <span className="block font-serif text-[21px] font-bold leading-none tracking-tight">
                Harvest<span className="text-[#719644]">Flow</span>
              </span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.24em] text-[#718477]">
                Farmer-first procurement
              </span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.label)}
                  className={`relative flex items-center gap-2 py-2 text-sm font-medium transition-colors ${
                    activeNav === item.label ? 'text-[#1a5a3d]' : 'text-[#6d7b71] hover:text-[#1a5a3d]'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                  {activeNav === item.label && (
                    <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-[#9cb957]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#d9e2d5] bg-white text-[#466254] transition hover:border-[#9dbd60] hover:text-[#1d593c]"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d27855] px-1 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Account dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 rounded-full border border-[#d9e2d5] bg-white py-1 pl-1 pr-3 transition hover:border-[#9dbd60]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e3edc2] text-xs font-bold text-[#356143]">
                {initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-bold leading-none text-[#234e38]">
                  {farmer?.full_name?.split(' ')[0] ?? 'Farmer'}
                </span>
                <span className="mt-0.5 block text-[10px] text-[#74867a]">
                  {farmer?.district}, {farmer?.state}
                </span>
              </span>
              <ChevronDown size={15} className="text-[#849286]" />
            </button>

            {showAccountMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAccountMenu(false)} />
                <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-[#dce6d6] bg-white p-3 shadow-2xl">
                  <div className="rounded-xl bg-[#f6f8f1] p-4">
                    <p className="text-sm font-bold text-[#234e38]">{farmer?.full_name}</p>
                    <p className="mt-1 text-xs text-[#7a897d]">{farmer?.phone}</p>
                    <p className="mt-0.5 text-xs text-[#7a897d]">{farmer?.district}, {farmer?.state}</p>
                  </div>
                  <div className="mt-2 space-y-1">
                    <button
                      onClick={() => { handleNav('My account'); setShowAccountMenu(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#4d6958] transition hover:bg-[#f6f8f1]"
                    >
                      <User size={16} /> My account
                    </button>
                    <button
                      onClick={() => { handleNav('My procurements'); setShowAccountMenu(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#4d6958] transition hover:bg-[#f6f8f1]"
                    >
                      <PackageCheck size={16} /> My procurements
                    </button>
                    <button
                      onClick={() => { handleNav('Payments'); setShowAccountMenu(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#4d6958] transition hover:bg-[#f6f8f1]"
                    >
                      <CreditCard size={16} /> Payments
                    </button>
                    <div className="my-1 border-t border-[#e8ede4]" />
                    <button
                      onClick={() => signOut()}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#c14a30] transition hover:bg-[#fde8e4]"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1d5238] text-white lg:hidden"
              aria-label="Open menu"
            >
              {mobileMenu ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenu && (
          <div className="mx-auto mt-4 flex max-w-[1440px] flex-col gap-1 border-t border-[#dce4d5] pt-3 lg:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.label)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                    activeNav === item.label ? 'bg-[#eff6de] text-[#1a5a3d]' : 'text-[#4d6958] hover:bg-white'
                  }`}
                >
                  <Icon size={18} /> {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[1440px] px-5 pb-14 pt-7 md:px-10 md:pt-10">
        {activeNav === 'Overview' && <OverviewPage onNavigate={handleNav} onOpenNotifications={() => setShowNotifications(true)} />}
        {activeNav === 'Book a slot' && <BookingPage />}
        {activeNav === 'My procurements' && <ProcurementsPage />}
        {activeNav === 'Payments' && <PaymentsPage />}
        {activeNav === 'My account' && <AccountPage />}
      </main>

      {/* Notifications panel */}
      <NotificationsPanel open={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#1d593c] px-5 py-3 text-sm font-semibold text-white shadow-xl">
          <Check size={17} className="text-[#d9ed91]" /> {toast}
        </div>
      )}
    </div>
  );
}
