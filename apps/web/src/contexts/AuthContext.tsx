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
import type { MeUser, UpdateProfileDto } from "@kayu/schemas";
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
  /** Dev-only email + password sign-in for seeded demo accounts. Resolves with the provisioned user. */
  login: (email: string, password: string) => Promise<AuthUser | null>;
  loginWithPhone: (phone: string) => Promise<void>;
  /** Resolves with the provisioned user so the auth screens can route without waiting for a render. */
  verifyOtp: (phone: string, code: string) => Promise<AuthUser | null>;
  acceptTerms: () => Promise<AuthUser>;
  updateProfile: (dto: UpdateProfileDto) => Promise<AuthUser>;
  refreshUser: () => Promise<AuthUser | null>;
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

type SignedInSnapshot = Extract<Snapshot, { status: "ready" | "needs-terms" }>;

function fromMe(me: MeUser): SignedInSnapshot {
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
  const [snapshot, setSnapshotState] = useState<Snapshot>(LOADING);
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const lastToken = useRef<string | null>(null);
  const snapshotRef = useRef<Snapshot>(LOADING);
  // Supabase notifies `onAuthStateChange` before `verifyOtp` resolves, so the explicit sync after
  // a sign-in usually finds the same token already loading: it joins that fetch instead of skipping.
  const inflight = useRef<{ token: string; promise: Promise<Snapshot> } | null>(null);

  const setSnapshot = useCallback((next: Snapshot) => {
    snapshotRef.current = next;
    setSnapshotState(next);
  }, []);

  const syncFromToken = useCallback(
    async (token: string | null): Promise<AuthUser | null> => {
      apiClient.setAccessToken(token);
      if (!token) {
        lastToken.current = null;
        inflight.current = null;
        setSnapshot(ANONYMOUS);
        return null;
      }
      if (lastToken.current === token) {
        if (inflight.current?.token === token) return (await inflight.current.promise).user;
        return snapshotRef.current.user;
      }
      lastToken.current = token;
      const promise = fetchMe();
      inflight.current = { token, promise };
      const next = await promise;
      if (lastToken.current === token) {
        setSnapshot(next);
        if (inflight.current?.token === token) inflight.current = null;
      }
      return next.user;
    },
    [setSnapshot],
  );

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
      return syncFromToken(data.session?.access_token ?? null);
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
      return syncFromToken(data.session?.access_token ?? null);
    },
    [supabase, syncFromToken],
  );

  const acceptTerms = useCallback(async () => {
    const response = await identityApi(apiClient).acceptTerms();
    const next = fromMe(response.user);
    setSnapshot(next);
    return next.user;
  }, [setSnapshot]);

  const updateProfile = useCallback(async (dto: UpdateProfileDto) => {
    const response = await identityApi(apiClient).updateProfile(dto);
    const next = fromMe(response.user);
    setSnapshot(next);
    return next.user;
  }, [setSnapshot]);

  const refreshUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    apiClient.setAccessToken(token);
    lastToken.current = token;
    const next = token ? await fetchMe() : ANONYMOUS;
    setSnapshot(next);
    return next.user;
  }, [supabase, setSnapshot]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    apiClient.setAccessToken(null);
    lastToken.current = null;
    inflight.current = null;
    setSnapshot(ANONYMOUS);
    router.push("/");
  }, [supabase, router, setSnapshot]);

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
      updateProfile,
      refreshUser,
      signOut,
    }),
    [snapshot, login, loginWithPhone, verifyOtp, acceptTerms, updateProfile, refreshUser, signOut],
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
