'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase';
import { apiClient } from '@/lib/api';
import { identityApi } from '@kayu/api';

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  avatar: string | null;
  isVerified: boolean;
  city: string | null;
  country: string;
  phone?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const response = await identityApi(apiClient).me();
      if (response.success && response.user) {
        const u = response.user;
        return {
          id: u.id,
          email: u.email ?? null,
          firstName: u.firstName ?? null,
          lastName: u.lastName ?? null,
          role: u.role as 'CLIENT' | 'PROVIDER' | 'ADMIN',
          avatar: u.avatar ?? null,
          isVerified: u.isVerified ?? false,
          city: u.city ?? null,
          country: u.country ?? 'CD',
          phone: u.phone ?? null,
        };
      }
    } catch {
      // token invalid or network error — treat as unauthenticated
    }
    return null;
  }, []);

  // Sync Supabase session changes → apiClient token → user state
  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.access_token) {
        apiClient.setAccessToken(session.access_token);
        const me = await fetchMe();
        if (mounted) {
          setUser(me);
        }
      }
      if (mounted) setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (session?.access_token) {
          apiClient.setAccessToken(session.access_token);
          const me = await fetchMe();
          if (mounted) setUser(me);
        } else {
          apiClient.setAccessToken(null);
          if (mounted) setUser(null);
        }
        if (mounted) setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session?.access_token) {
      apiClient.setAccessToken(data.session.access_token);
      const me = await fetchMe();
      setUser(me);
    }
  }, [supabase, fetchMe]);

  const loginWithPhone = useCallback(async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  }, [supabase]);

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) throw error;
    if (data.session?.access_token) {
      apiClient.setAccessToken(data.session.access_token);
      const me = await fetchMe();
      setUser(me);
    }
  }, [supabase, fetchMe]);

  const register = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, [supabase]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    apiClient.setAccessToken(null);
    setUser(null);
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      apiClient.setAccessToken(session.access_token);
      const me = await fetchMe();
      setUser(me);
    } else {
      setUser(null);
    }
  }, [supabase, fetchMe]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithPhone,
        verifyOtp,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
