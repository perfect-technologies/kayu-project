import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { supabase } from './supabase';
import { apiClient } from './api';
import { identityApi } from '@kayu/api';

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  roleSelectedAt: string | Date | null;
  avatar: string | null;
  isVerified: boolean;
  city: string | null;
  country: string;
  phone?: string | null;
  profileComplete: boolean;
  hasProviderProfile: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Dev-only email+password sign-in for seeded demo accounts. */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  /** Freeze auto-login so multi-step OTP flow can complete profile before navigator flips. */
  setAuthFlowPending: (pending: boolean) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readRoleSelectedAt(user: unknown): string | Date | null {
  if (!user || typeof user !== 'object' || !('roleSelectedAt' in user)) {
    return null;
  }

  const value = (user as { roleSelectedAt?: string | Date | null }).roleSelectedAt;
  return value ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // When true, onAuthStateChange will not set user (keeps navigation on auth stack)
  const suppressAutoLogin = useRef(false);

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
          roleSelectedAt: readRoleSelectedAt(u),
          avatar: u.avatar ?? null,
          isVerified: u.isVerified ?? false,
          city: u.city ?? null,
          country: u.country ?? 'CD',
          phone: u.phone ?? null,
          profileComplete: u.profileComplete ?? false,
          hasProviderProfile: Boolean(u.provider),
        };
      }
    } catch {
      // token invalid or network error — treat as unauthenticated
    }
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;

    // Restore session from SecureStore
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.access_token) {
        apiClient.setAccessToken(session.access_token);
        const me = await fetchMe();
        if (mounted) setUser(me);
      }
      if (mounted) setIsLoading(false);
    });

    // Listen for auth state changes (token refresh, sign-in/out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (suppressAutoLogin.current) {
        // Token is already set on apiClient by signUpAndLogin — just skip user update
        if (mounted) setIsLoading(false);
        return;
      }
      if (session?.access_token) {
        apiClient.setAccessToken(session.access_token);
        const me = await fetchMe();
        if (mounted) setUser(me);
      } else {
        apiClient.setAccessToken(null);
        if (mounted) setUser(null);
      }
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchMe]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      suppressAutoLogin.current = false;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.session?.access_token) {
        apiClient.setAccessToken(data.session.access_token);
        const me = await fetchMe();
        setUser(me);
      }
    },
    [fetchMe],
  );

  const signInWithPhone = useCallback(async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(
    async (phone: string, token: string) => {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });
      if (error) throw error;
      if (data.session?.access_token) {
        apiClient.setAccessToken(data.session.access_token);
        const me = await fetchMe();
        setUser(me);
      }
    },
    [fetchMe],
  );

  const setAuthFlowPending = useCallback((pending: boolean) => {
    suppressAutoLogin.current = pending;
  }, []);

  const signOut = useCallback(async () => {
    suppressAutoLogin.current = false;
    await supabase.auth.signOut();
    apiClient.setAccessToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    // Re-enable auto-login (profile completion is done)
    suppressAutoLogin.current = false;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      apiClient.setAccessToken(session.access_token);
      const me = await fetchMe();
      setUser(me);
    } else {
      setUser(null);
    }
  }, [fetchMe]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signInWithEmail,
        signInWithPhone,
        verifyOtp,
        setAuthFlowPending,
        signOut,
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

export function hasRequiredProfileName(user: Pick<AuthUser, 'firstName' | 'lastName'>): boolean {
  return Boolean(user.firstName?.trim() && user.lastName?.trim());
}

export function needsClientProfileCompletion(user: AuthUser | null): boolean {
  return Boolean(user && user.role === 'CLIENT' && !hasRequiredProfileName(user));
}
