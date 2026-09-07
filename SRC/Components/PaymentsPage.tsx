import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase, type Payment } from '@/lib/supabase';
import { CreditCard, Loader2, Check, Clock3 } from 'lucide-react';

export default function PaymentsPage() {
  const { farmer } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!farmer) return;
    (async () => {
      const { data } = await supabase
        .from('payments')
        .select('*, procurement:procurements(*)')
        .eq('farmer_id', farmer.id)
        .order('created_at', { ascending: false });
      setPayments(data ?? []);
      setLoading(false);
    })();
  }, [farmer]);

  const totalPaid = payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount_rs, 0);
  const totalProcessing = payments.filter((p) => p.status === 'processing').reduce((s, p) => s + p.amount_rs, 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#6d9846]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#1d4935] md:text-4xl">Payments</h1>
        <p className="mt-2 text-[15px] text-[#718176]">Track all your procurement payments in one place.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[24px] border border-[#e0e7d7] bg-[#edf3df] p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#668e43]">
              <Check size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#7a897d]">Total received</p>
              <p className="mt-1 font-serif text-2xl font-bold text-[#234e38]">₹ {totalPaid.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[24px] border border-[#e0e7d7] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff9e3] text-[#a68435]">
              <Clock3 size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#7a897d]">In processing</p>
              <p className="mt-1 font-serif text-2xl font-bold text-[#234e38]">₹ {totalProcessing.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment list */}
      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[28px] border border-[#e0e7d7] bg-white py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eef5df] text-[#6d9846]">
            <CreditCard size={28} />
          </div>
          <p className="mt-5 text-lg font-bold text-[#355842]">No payments yet</p>
          <p className="mt-1 text-sm text-[#849087]">Payments appear here once your procurement is processed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center gap-4 rounded-[24px] border border-[#e0e7d7] bg-white p-5 shadow-sm">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                payment.status === 'completed' ? 'bg-[#d8ec91] text-[#3d763d]'
                : payment.status === 'processing' ? 'bg-[#fff9e3] text-[#a68435]'
                : 'bg-[#f6f8f1] text-[#9aab8e]'
              }`}>
                {payment.status === 'completed' ? <Check size={22} /> : <Clock3 size={22} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#315741]">
                  ₹ {payment.amount_rs.toLocaleString('en-IN')}
                </p>
                <p className="mt-1 text-xs text-[#7a897d]">
                  {payment.procurement?.crop_type ?? 'Crop'} · {payment.procurement?.quantity_quintals ?? 0} qtl · {payment.method.replace(/_/g, ' ')}
                </p>
                {payment.reference_number && (
                  <p className="mt-1 text-[11px] text-[#9aab8e]">Ref: {payment.reference_number}</p>
                )}
              </div>
              <div className="text-right">
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  payment.status === 'completed' ? 'bg-[#ecf6e7] text-[#5c9756]'
                  : payment.status === 'processing' ? 'bg-[#fff9e3] text-[#a68435]'
                  : 'bg-gray-100 text-gray-600'
                }`}>
                  {payment.status}
                </span>
                {payment.expected_date && (
                  <p className="mt-2 text-[11px] text-[#9aab8e]">By {payment.expected_date}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
