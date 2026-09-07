import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase, type Notification } from '@/lib/supabase';
import { Bell, Check, Loader2, X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NotificationsPanel({ open, onClose }: Props) {
  const { farmer } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!farmer || !open) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('farmer_id', farmer.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(data ?? []);
      setLoading(false);
    })();
  }, [farmer, open]);

  const markAllRead = async () => {
    if (!farmer) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('farmer_id', farmer.id)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  if (!open) return null;

  return (
    <div className="fixed right-5 top-[78px] z-40 w-[min(380px,calc(100vw-40px))] rounded-2xl border border-[#dce6d6] bg-white p-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-[#214c37]">Latest updates</h3>
        <button onClick={onClose} aria-label="Close notifications">
          <X size={18} className="text-[#779080]" />
        </button>
      </div>
      <button
        onClick={markAllRead}
        className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#6a9348]"
      >
        <Check size={14} /> Mark all as read
      </button>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#6d9846]" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-10">
          <Bell size={28} className="text-[#c5d3c0]" />
          <p className="mt-3 text-sm text-[#849087]">No notifications yet</p>
        </div>
      ) : (
        <div className="mt-4 max-h-[400px] space-y-3 overflow-y-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl p-3 ${n.is_read ? 'bg-[#f7f8f3]' : 'bg-[#eff6df]'}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#3d6d42]">{n.title}</p>
                {!n.is_read && <span className="h-2 w-2 rounded-full bg-[#d27855]" />}
              </div>
              <p className="mt-1 text-xs leading-5 text-[#687b6c]">{n.message}</p>
              <p className="mt-2 text-[10px] text-[#94a298]">
                {new Date(n.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
