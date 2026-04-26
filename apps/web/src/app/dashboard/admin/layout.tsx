'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BadgeCheck,
  Bell,
  ChevronDown,
  Coins,
  Flag,
  Home as HomeIcon,
  Layers,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SECTIONS = [
  { id: 'overview', label: "Vue d'ensemble", icon: HomeIcon },
  { id: 'verification', label: 'Vérifications', icon: BadgeCheck },
  { id: 'disputes', label: 'Litiges', icon: Flag },
  { id: 'moderation', label: 'Modération', icon: ShieldCheck },
  { id: 'categories', label: 'Catégories', icon: Layers },
  { id: 'payouts', label: 'Payouts', icon: Coins },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--k-bg)' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--k-bg)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'ADMIN') {
    return null;
  }

  const activeTab = searchParams.get('tab') ?? 'overview';
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Admin';
  const initials =
    `${(user.firstName ?? '').charAt(0)}${(user.lastName ?? '').charAt(0)}`.toUpperCase() ||
    'KA';

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const buildHref = (id: string) => `${pathname}?tab=${id}`;

  return (
    <div className="min-h-screen" style={{ background: 'var(--k-bg)' }}>
      {/* Dark ops top bar */}
      <div
        className="sticky top-0 z-40 border-b"
        style={{
          background: '#0F172A',
          color: 'white',
          borderColor: '#1E293B',
        }}
      >
        <div className="flex items-center gap-4 px-4 sm:px-6 py-2.5 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              K
            </div>
            <span
              style={{
                fontFamily: 'var(--k-font-display)',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '-0.01em',
              }}
            >
              KAYOU Ops
            </span>
            <span
              className="hidden sm:inline"
              style={{
                fontSize: 10,
                padding: '2px 7px',
                background: '#1E293B',
                borderRadius: 4,
                color: '#94A3B8',
                fontFamily: 'var(--k-font-mono)',
                letterSpacing: '0.04em',
              }}
            >
              INTERNE
            </span>
          </div>

          <nav className="flex items-center gap-1 shrink-0">
            {SECTIONS.map((s) => {
              const active = activeTab === s.id;
              const Icon = s.icon;
              return (
                <Link
                  key={s.id}
                  href={buildHref(s.id)}
                  scroll={false}
                  className="inline-flex items-center gap-1.5"
                  style={{
                    background: active ? '#1E293B' : 'transparent',
                    color: active ? 'white' : '#94A3B8',
                    padding: '7px 12px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 500,
                    transition: 'color 120ms',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon size={13} />
                  {s.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          <div
            className="hidden lg:flex items-center gap-2 shrink-0"
            style={{ fontSize: 11.5, color: '#94A3B8' }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 0 3px rgba(16,185,129,0.2)',
              }}
            />
            Système opérationnel
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 shrink-0"
                style={{
                  padding: '3px 10px 3px 3px',
                  background: '#1E293B',
                  borderRadius: 999,
                  border: 0,
                  cursor: 'pointer',
                  color: 'white',
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: '#7C3AED',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </div>
                <span className="hidden sm:inline" style={{ fontSize: 12, fontWeight: 500 }}>
                  {fullName}
                </span>
                <ChevronDown size={12} className="hidden sm:inline" style={{ color: '#94A3B8' }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{fullName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <User className="h-4 w-4 mr-2" />
                  Mon profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Light utility bar — search + notifications, sits below the dark ops bar */}
      <div
        className="sticky z-30 border-b"
        style={{
          top: 53,
          background: 'var(--k-surface)',
          borderColor: 'var(--k-border)',
        }}
      >
        <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5 max-w-[1440px] mx-auto">
          <div className="relative flex-1 max-w-xl">
            <Search
              size={14}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                left: 12,
                color: 'var(--k-text-subtle)',
              }}
            />
            <input
              type="text"
              placeholder="Rechercher dans KAYOU…"
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                border: '1px solid var(--k-border)',
                borderRadius: 8,
                fontSize: 13,
                background: 'var(--k-bg)',
                outline: 0,
                color: 'var(--k-text-primary)',
              }}
            />
          </div>
          <div className="flex-1" />
          <button
            type="button"
            title="Notifications"
            className="relative inline-flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--k-surface)',
              border: '1px solid var(--k-border)',
              color: 'var(--k-text-body)',
              cursor: 'pointer',
            }}
          >
            <Bell size={16} />
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 16,
                height: 16,
                borderRadius: 999,
                background: '#DC2626',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              3
            </span>
          </button>
        </div>
      </div>

      {/* Body */}
      {children}
    </div>
  );
}
