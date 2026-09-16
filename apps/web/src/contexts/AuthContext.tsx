"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ApiError, identityApi } from "@kayu/api";
import type { MeUser } from "@kayu/schemas";
import { apiClient } from "@/lib/api";
import { createClient } from "@/lib/supabase";

export type AuthStatus = "loading" | "anonymous" | "needs-terms" | "suspended" | "ready";
export type AuthRole = "CLIENT" | "PROVIDER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: AuthRole;
  country: string;
  profileComplete: boolean;
  termsAcceptedAt: string | null;
  suspendedReason: string | null;
  provider: MeUser["provider"];
}

type Snapshot =
  | { status: "loading" | "anonymous"; user: null; suspendedReason: null }
  | { status: "ready" | "needs-terms"; user: AuthUser; suspendedReason: null }
  | { status: "suspended"; user: null; suspendedReason: string | null };

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  suspendedReason: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Dev-only email + password sign-in for seeded demo accounts. */
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  acceptTerms: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const LOADING: Snapshot = { status: "loading", user: null, suspendedReason: null };
const ANONYMOUS: Snapshot = { status: "anonymous", user: null, suspendedReason: null };

const AuthContext = createContext<AuthContextValue | null>(null);

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toAuthUser(me: MeUser): AuthUser {
  return {
    id: me.id,
    email: me.email,
    phone: me.phone,
    firstName: me.firstName,
    lastName: me.lastName,
    avatar: me.avatar,
    role: me.role,
    country: me.country,
    profileComplete: me.profileComplete,
    termsAcceptedAt: toIso(me.termsAcceptedAt),
    suspendedReason: me.suspendedReason,
    provider: me.provider,
  };
}

function fromMe(me: MeUser): Snapshot {
  const user = toAuthUser(me);
  return { status: user.termsAcceptedAt ? "ready" : "needs-terms", user, suspendedReason: null };
}

async function fetchMe(): Promise<Snapshot> {
  try {
    const response = await identityApi(apiClient).me();
    return fromMe(response.user);
  } catch (error) {
    if (error instanceof ApiError && error.code === "ACCOUNT_SUSPENDED") {
      const body = error.body as { suspendedReason?: string | null } | undefined;
      return { status: "suspended", user: null, suspendedReason: body?.suspendedReason ?? null };
    }
    return ANONYMOUS;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(LOADING);
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const lastToken = useRef<string | null>(null);

  const syncFromToken = useCallback(async (token: string | null) => {
    apiClient.setAccessToken(token);
    if (!token) {
      lastToken.current = null;
      setSnapshot(ANONYMOUS);
      return;
    }
    if (lastToken.current === token) return;
    lastToken.current = token;
    const next = await fetchMe();
    if (lastToken.current === token) setSnapshot(next);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      void syncFromToken(session?.access_token ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      void syncFromToken(session?.access_token ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, syncFromToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await syncFromToken(data.session?.access_token ?? null);
    },
    [supabase, syncFromToken],
  );

  const loginWithPhone = useCallback(
    async (phone: string) => {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
    },
    [supabase],
  );

  const verifyOtp = useCallback(
    async (phone: string, token: string) => {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
      if (error) throw error;
      await syncFromToken(data.session?.access_token ?? null);
    },
    [supabase, syncFromToken],
  );

  const acceptTerms = useCallback(async () => {
    const response = await identityApi(apiClient).acceptTerms();
    setSnapshot(fromMe(response.user));
  }, []);

  const refreshUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    apiClient.setAccessToken(token);
    lastToken.current = token;
    setSnapshot(token ? await fetchMe() : ANONYMOUS);
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    apiClient.setAccessToken(null);
    lastToken.current = null;
    setSnapshot(ANONYMOUS);
    router.push("/");
  }, [supabase, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: snapshot.status,
      user: snapshot.user,
      suspendedReason: snapshot.suspendedReason,
      isLoading: snapshot.status === "loading",
      isAuthenticated: snapshot.status === "ready" || snapshot.status === "needs-terms",
      login,
      loginWithPhone,
      verifyOtp,
      acceptTerms,
      refreshUser,
      signOut,
    }),
    [snapshot, login, loginWithPhone, verifyOtp, acceptTerms, refreshUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
