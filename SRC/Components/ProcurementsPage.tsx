import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase, type Procurement } from '@/lib/supabase';
import { Check, ChevronRight, FileText, Loader2, Truck, CreditCard, Wheat, AlertCircle, Clock3 } from 'lucide-react';

export default function ProcurementsPage() {
  const { farmer } = useAuth();
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [payingFor, setPayingFor] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const loadProcurements = async () => {
    if (!farmer) return;
    const { data } = await supabase
      .from('procurements')
      .select('*, center:procurement_centers(*)')
      .eq('farmer_id', farmer.id)
      .order('registered_at', { ascending: false });
    setProcurements(data ?? []);
  };

  useEffect(() => {
    if (!farmer) return;
    (async () => {
      await loadProcurements();
      setLoading(false);
    })();
  }, [farmer]);

  const handleRequestPayment = async (procurement: Procurement) => {
    if (!farmer) return;
    setPayingFor(procurement.id);
    setError('');

    try {
      const amount = procurement.quantity_quintals * 2450;
      const refNum = `HF${Date.now().toString().slice(-8)}`;
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 2);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      const { error: payError } = await supabase.from('payments').insert({
        farmer_id: farmer.id,
        procurement_id: procurement.id,
        amount_rs: amount,
        status: 'processing',
        method: 'bank_transfer',
        reference_number: refNum,
        expected_date: expectedDateStr,
      });

      if (payError) throw payError;

      await supabase.from('procurements')
        .update({ status: 'quality_checked', quality_checked_at: new Date().toISOString() })
        .eq('id', procurement.id);

      await supabase.from('notifications').insert({
        farmer_id: farmer.id,
        type: 'payment_update',
        title: 'Payment initiated',
        message: `Payment of ₹ ${amount.toLocaleString('en-IN')} for ${procurement.crop_type} (${procurement.quantity_quintals} qtl) is now processing. Reference: ${refNum}. Expected by ${expectedDateStr}.`,
      });

      setToast('Payment request submitted. A notification has been sent.');
      setTimeout(() => setToast(''), 4000);
      await loadProcurements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment request failed. Please try again.');
    }
    setPayingFor(null);
  };

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
        <h1 className="font-serif text-3xl font-bold text-[#1d4935] md:text-4xl">My procurements</h1>
        <p className="mt-2 text-[15px] text-[#718176]">Track the status of every crop delivery and quality assessment.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-[#fde8e4] px-4 py-3 text-sm text-[#c14a30]">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {procurements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[28px] border border-[#e0e7d7] bg-white py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eef5df] text-[#6d9846]">
            <Wheat size={28} />
          </div>
          <p className="mt-5 text-lg font-bold text-[#355842]">No procurements yet</p>
          <p className="mt-1 text-sm text-[#849087]">Book a slot to start your first procurement.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {procurements.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-[24px] border border-[#e0e7d7] bg-white shadow-sm">
              <button
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                className="flex w-full items-center gap-4 p-5 text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf3d2] text-[#6d9842]">
                  <Wheat size={22} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#315741]">{p.crop_type} · {p.quantity_quintals} quintals</p>
                  <p className="mt-1 text-xs text-[#7a897d]">
                    {p.center?.name} · {new Date(p.registered_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <StatusBadge status={p.status} />
                <ChevronRight
                  size={18}
                  className={`text-[#9aab8e] transition ${expanded === p.id ? 'rotate-90' : ''}`}
                />
              </button>

              {expanded === p.id && (
                <div className="border-t border-[#e8ede4] px-5 pb-5 pt-4">
                  <div className="space-y-5">
                    <TimelineStep
                      icon={Check}
                      title="Registered"
                      detail={new Date(p.registered_at).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      done
                    />
                    <TimelineStep
                      icon={Truck}
                      title="Delivery checked in"
                      detail={p.checked_in_at ? new Date(p.checked_in_at).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Awaiting check-in at centre'}
                      done={!!p.checked_in_at}
                      active={!p.checked_in_at}
                    />
                    <TimelineStep
                      icon={FileText}
                      title="Quality assessment"
                      detail={p.quality_checked_at
                        ? `Grade: ${p.grade ?? 'A'} · Moisture: ${p.moisture_percent ?? 'N/A'}%`
                        : 'Sample is being reviewed'}
                      done={!!p.quality_checked_at}
                      active={!!p.checked_in_at && !p.quality_checked_at}
                    />
                    <TimelineStep
                      icon={CreditCard}
                      title="Payment released"
                      detail={p.payment_released_at
                        ? new Date(p.payment_released_at).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : 'Usually within 48 hours of quality check'}
                    />
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <InfoCell label="Centre" value={p.center?.name ?? '—'} />
                    <InfoCell label="Quantity" value={`${p.quantity_quintals} qtl`} />
                    <InfoCell label="Grade" value={p.grade ?? 'Pending'} />
                    <InfoCell label="Est. value" value={`₹ ${(p.quantity_quintals * 2450).toLocaleString('en-IN')}`} />
                  </div>

                  {p.status === 'registered' && (
                    <button
                      onClick={() => handleRequestPayment(p)}
                      disabled={payingFor === p.id}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1d593c] py-3 text-sm font-bold text-white transition hover:bg-[#15472f] disabled:opacity-60"
                    >
                      {payingFor === p.id ? (
                        <><Loader2 size={16} className="animate-spin" /> Processing payment...</>
                      ) : (
                        <><CreditCard size={16} /> Request payment for this procurement</>
                      )}
                    </button>
                  )}
                  {p.status === 'quality_checked' && (
                    <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#fff9e3] px-4 py-3 text-sm text-[#a68435]">
                      <Clock3 size={16} /> Payment is processing. You will be notified when it is released.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#1d593c] px-5 py-3 text-sm font-semibold text-white shadow-xl">
          <Check size={17} className="text-[#d9ed91]" /> {toast}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    registered: 'bg-[#eaf3d2] text-[#5c9756]',
    checked_in: 'bg-[#e3edc2] text-[#5c9756]',
    quality_checked: 'bg-[#fff2d5] text-[#a17e3b]',
    payment_released: 'bg-[#d8ec91] text-[#3d763d]',
    completed: 'bg-[#d8ec91] text-[#3d763d]',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function TimelineStep({
  icon: Icon, title, detail, done, active,
}: {
  icon: typeof Check; title: string; detail: string; done?: boolean; active?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        done ? 'bg-[#d8ec91] text-[#3d763d]'
        : active ? 'border-2 border-[#9fbc62] bg-[#f2f7e6] text-[#6c944c]'
        : 'border border-[#dce5d9] bg-white text-[#a8b4a9]'
      }`}>
        <Icon size={16} />
      </div>
      <div className="pt-0.5">
        <p className={`text-sm font-bold ${active ? 'text-[#315d3e]' : 'text-[#4e6958]'}`}>{title}</p>
        <p className="mt-1 text-xs text-[#89968c]">{detail}</p>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f6f8f1] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aab8e]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#315741]">{value}</p>
    </div>
  );
}
