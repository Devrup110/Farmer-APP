import { useAuth } from '@/lib/AuthContext';
import AuthPage from '@/Components/AuthPage';
import Dashboard from '@/Components/Dashboard';
import { Loader2, Sprout } from 'lucide-react';

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f7f1]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#cfe56d] text-[#183b2b]">
          <Sprout size={28} strokeWidth={1.8} />
        </div>
        <div className="mt-5 flex items-center gap-2 text-[#6d9846]">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-semibold">Loading HarvestFlow...</span>
        </div>
      </div>
    );
  }

  return session ? <Dashboard /> : <AuthPage />;
}

export default App;
