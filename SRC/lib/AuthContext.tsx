import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Farmer } from '@/lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  farmer: Farmer | null;
  loading: boolean;
  signUp: (email: string, password: string, farmerData: Omit<Farmer, 'id' | 'created_at'>) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshFarmer: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFarmer = async (uid: string) => {
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    if (!error && data) setFarmer(data as Farmer);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadFarmer(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await loadFarmer(newSession.user.id);
        } else {
          setFarmer(null);
        }
        setLoading(false);
      })();
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    farmerData: Omit<Farmer, 'id' | 'created_at'>
  ) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign-up failed. Please try again.' };

    const { error: profileError } = await supabase.from('farmers').insert({
      id: data.user.id,
      full_name: farmerData.full_name,
      phone: farmerData.phone,
      aadhaar_number: farmerData.aadhaar_number,
      state: farmerData.state,
      district: farmerData.district,
      village: farmerData.village,
      land_size_acres: farmerData.land_size_acres,
    });

    if (profileError) return { error: profileError.message };
    await loadFarmer(data.user.id);
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setFarmer(null);
  };

  const refreshFarmer = async () => {
    if (user) await loadFarmer(user.id);
  };

  return (
    <AuthContext.Provider value={{ session, user, farmer, loading, signUp, signIn, signOut, refreshFarmer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
