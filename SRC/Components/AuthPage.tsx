import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Sprout, ArrowRight, User, Phone, MapPin, Lock, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

const indianStates = [
  'Haryana', 'Punjab', 'Uttar Pradesh', 'Rajasthan', 'Madhya Pradesh',
  'Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh',
  'Telangana', 'West Bengal', 'Bihar', 'Odisha', 'Kerala',
];

function aadhaarToEmail(aadhaar: string): string {
  const digits = aadhaar.replace(/\D/g, '');
  return `farmer_${digits}@harvestflow.in`;
}

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [aadhaar, setAadhaar] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Haryana');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [landSize, setLandSize] = useState('');

  const formatAadhaar = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanAadhaar = aadhaar.replace(/\s/g, '');
    if (cleanAadhaar.length !== 12) {
      setError('Aadhaar number must be 12 digits.');
      setLoading(false);
      return;
    }

    const email = aadhaarToEmail(cleanAadhaar);

    if (mode === 'signin') {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    } else {
      if (!fullName || !phone || !district) {
        setError('Please fill in all required fields.');
        setLoading(false);
        return;
      }
      const { error: err } = await signUp(email, password, {
        full_name: fullName,
        phone,
        aadhaar_number: cleanAadhaar,
        state,
        district,
        village: village || null,
        land_size_acres: landSize ? parseFloat(landSize) : null,
      });
      if (err) setError(err);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-[#1a4a35] p-8 text-white lg:w-[45%] lg:min-h-screen lg:p-14">
        <img
          src="https://images.pexels.com/photos/7631692/pexels-photo-7631692.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt="Farmer in wheat field"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#163d2c] via-[#1a4a35]/90 to-[#1a4a35]/70" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#cfe56d] text-[#183b2b]">
              <Sprout size={26} strokeWidth={1.8} />
            </span>
            <div>
              <p className="font-serif text-2xl font-bold leading-none">Harvest<span className="text-[#9ec95e]">Flow</span></p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a8c9a0]">Farmer-first procurement</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 hidden lg:block">
          <h1 className="font-serif text-4xl font-bold leading-tight">Book your slot.<br />Skip the wait.</h1>
          <p className="mt-4 max-w-md text-[15px] leading-7 text-[#c2d8c4]">
            Register once with your Aadhaar, reserve a visit to your nearest procurement centre, track your place in line, and get paid without spending your day waiting.
          </p>
          <div className="mt-8 flex gap-6">
            <Stat value="4" label="Centres available" />
            <Stat value="30 min" label="Avg. wait saved" />
            <Stat value="48 hrs" label="Payment cycle" />
          </div>
        </div>
        <div className="relative z-10 text-[11px] text-[#9bbaa0]">© 2025 HarvestFlow · Empowering farmers</div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-[#f6f7f1] p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-7">
            <h2 className="font-serif text-3xl font-bold text-[#1d4935]">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-2 text-sm text-[#718176]">
              {mode === 'signin'
                ? 'Sign in with your Aadhaar number to manage your procurements.'
                : 'Register with your Aadhaar to start booking procurement slots.'}
            </p>
          </div>

          {/* Toggle */}
          <div className="mb-6 flex rounded-full bg-[#e8ede4] p-1">
            <button
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${mode === 'signin' ? 'bg-white text-[#1d593c] shadow-sm' : 'text-[#718176]'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${mode === 'signup' ? 'bg-white text-[#1d593c] shadow-sm' : 'text-[#718176]'}`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#fde8e4] px-4 py-3 text-sm text-[#c14a30]">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <Field icon={User} label="Full name *">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ramesh Kumar"
                    className="w-full bg-transparent text-sm text-[#234e38] outline-none placeholder:text-[#aebfae]"
                    required
                  />
                </Field>
                <Field icon={Phone} label="Phone number *">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full bg-transparent text-sm text-[#234e38] outline-none placeholder:text-[#aebfae]"
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field icon={MapPin} label="State *">
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-transparent text-sm text-[#234e38] outline-none"
                    >
                      {indianStates.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field icon={MapPin} label="District *">
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Karnal"
                      className="w-full bg-transparent text-sm text-[#234e38] outline-none placeholder:text-[#aebfae]"
                      required
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field icon={MapPin} label="Village">
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="Optional"
                      className="w-full bg-transparent text-sm text-[#234e38] outline-none placeholder:text-[#aebfae]"
                    />
                  </Field>
                  <Field icon={Sprout} label="Land (acres)">
                    <input
                      type="number"
                      step="0.1"
                      value={landSize}
                      onChange={(e) => setLandSize(e.target.value)}
                      placeholder="Optional"
                      className="w-full bg-transparent text-sm text-[#234e38] outline-none placeholder:text-[#aebfae]"
                    />
                  </Field>
                </div>
              </>
            )}

            <Field icon={ShieldCheck} label="Aadhaar number *">
              <input
                type="text"
                value={aadhaar}
                onChange={(e) => setAadhaar(formatAadhaar(e.target.value))}
                placeholder="XXXX XXXX XXXX"
                className="w-full bg-transparent text-sm text-[#234e38] outline-none placeholder:text-[#aebfae]"
                required
                maxLength={14}
              />
            </Field>
            <Field icon={Lock} label="Password *">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-transparent text-sm text-[#234e38] outline-none placeholder:text-[#aebfae]"
                required
                minLength={6}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1d593c] py-3.5 text-sm font-bold text-white transition hover:bg-[#15472f] disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Please wait...</>
              ) : (
                <>{mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={17} /></>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#8a9b8e]">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="font-bold text-[#5d9148]"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-serif text-2xl font-bold text-[#d8ec8e]">{value}</p>
      <p className="mt-1 text-[11px] text-[#a8c9a0]">{label}</p>
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: typeof User; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[#63776a]">{label}</span>
      <div className="flex items-center gap-3 rounded-xl border border-[#d9e2d5] bg-white px-4 py-3 transition focus-within:border-[#8dad50] focus-within:shadow-[0_0_0_3px_#eff6de]">
        <Icon size={17} className="shrink-0 text-[#9aab8e]" />
        {children}
      </div>
    </label>
  );
}
