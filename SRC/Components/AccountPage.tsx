import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Check, Loader2, LogOut, MapPin, Phone, Sprout, User, AlertCircle, ShieldCheck,
} from 'lucide-react';

export default function AccountPage() {
  const { farmer, user, signOut, refreshFarmer } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState(farmer?.full_name ?? '');
  const [phone, setPhone] = useState(farmer?.phone ?? '');
  const [village, setVillage] = useState(farmer?.village ?? '');
  const [landSize, setLandSize] = useState(farmer?.land_size_acres?.toString() ?? '');

  const handleSave = async () => {
    if (!farmer) return;
    setError('');
    setSaving(true);
    const { error: err } = await supabase
      .from('farmers')
      .update({
        full_name: fullName,
        phone,
        village: village || null,
        land_size_acres: landSize ? parseFloat(landSize) : null,
      })
      .eq('id', farmer.id);
    if (err) {
      setError(err.message);
    } else {
      await refreshFarmer();
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (!farmer) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#1d4935] md:text-4xl">My account</h1>
        <p className="mt-2 text-[15px] text-[#718176]">View and manage your farmer profile.</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-[#ecf6e7] px-4 py-3 text-sm text-[#5c9756]">
          <Check size={16} /> Profile updated successfully.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-[#fde8e4] px-4 py-3 text-sm text-[#c14a30]">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Profile card */}
      <div className="rounded-[28px] border border-[#e0e7d7] bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e3edc2] text-2xl font-bold text-[#356143]">
            {farmer.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#234e38]">{farmer.full_name}</h2>
            <p className="mt-1 text-sm text-[#7a897d]">Farmer ID: {farmer.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <InfoRow icon={ShieldCheck} label="Aadhaar number" value={farmer.aadhaar_number ? `${farmer.aadhaar_number.slice(0,4)} ${farmer.aadhaar_number.slice(4,8)} ${farmer.aadhaar_number.slice(8,12)}` : '—'} />
          <InfoRow icon={Phone} label="Phone" value={farmer.phone} />
          <InfoRow icon={MapPin} label="State" value={farmer.state} />
          <InfoRow icon={MapPin} label="District" value={farmer.district} />
          <InfoRow icon={MapPin} label="Village" value={farmer.village ?? 'Not provided'} />
          <InfoRow icon={Sprout} label="Land size" value={farmer.land_size_acres ? `${farmer.land_size_acres} acres` : 'Not provided'} />
          <InfoRow icon={User} label="Member since" value={new Date(farmer.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} />
        </div>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="mt-6 flex items-center gap-2 rounded-full bg-[#1d593c] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#15472f]"
          >
            Edit profile
          </button>
        ) : (
          <div className="mt-6 space-y-4 rounded-2xl bg-[#f6f8f1] p-5">
            <EditField label="Full name" value={fullName} onChange={setFullName} />
            <EditField label="Phone" value={phone} onChange={setPhone} />
            <EditField label="Village" value={village} onChange={setVillage} />
            <EditField label="Land size (acres)" value={landSize} onChange={setLandSize} type="number" />
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-[#1d593c] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#15472f] disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Save changes
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFullName(farmer.full_name);
                  setPhone(farmer.phone);
                  setVillage(farmer.village ?? '');
                  setLandSize(farmer.land_size_acres?.toString() ?? '');
                }}
                className="rounded-full border border-[#d9e2d5] px-5 py-2.5 text-sm font-bold text-[#63776a] transition hover:bg-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="rounded-[28px] border border-[#e0e7d7] bg-white p-6 shadow-sm md:p-8">
        <h3 className="font-serif text-xl font-bold text-[#234e38]">Session</h3>
        <p className="mt-2 text-sm text-[#7a897d]">Sign out of your account on this device.</p>
        <button
          onClick={() => signOut()}
          className="mt-4 flex items-center gap-2 rounded-full bg-[#fde8e4] px-5 py-2.5 text-sm font-bold text-[#c14a30] transition hover:bg-[#fbd9d1]"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#f6f8f1] p-3">
      <Icon size={17} className="shrink-0 text-[#9aab8e]" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aab8e]">{label}</p>
        <p className="mt-0.5 text-sm font-bold text-[#315741]">{value}</p>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[#63776a]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#d9e2d5] bg-white px-4 py-3 text-sm text-[#234e38] outline-none focus:border-[#8dad50] focus:shadow-[0_0_0_3px_#eff6de]"
      />
    </label>
  );
}
