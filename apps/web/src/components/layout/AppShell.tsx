'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Calendar,
  MessageSquare,
  Settings,
  User,
  Bell,
  LogOut,
  Menu,
  LayoutDashboard,
  Briefcase,
  Wallet,
  HelpCircle,
  ChevronDown,
  Crown,
  Shield,
  ShieldCheck,
  Inbox,
  Layers,
  Coins,
  Flag,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { launchFlags } from '@/lib/launch-flags';

interface NavItem {
  name: string;
  href: string;
  icon: typeof Home;
  badge?: number;
}

const clientNavItems: NavItem[] = [
  { name: 'Tableau de bord', href: '/dashboard/client', icon: LayoutDashboard },
  { name: 'Mes réservations', href: '/bookings', icon: Calendar },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];

const providerNavItems: NavItem[] = [
  { name: 'Tableau de bord', href: '/pro', icon: LayoutDashboard },
  ...(launchFlags.enableJobRequests
    ? [{ name: 'Demandes', href: '/pro/requests', icon: Inbox }]
    : []),
  { name: 'Mes réservations', href: '/bookings', icon: Calendar },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Gains', href: '/pro/earnings', icon: Wallet },
  { name: 'Vérification', href: '/pro/verify', icon: BadgeCheck },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];

const adminNavItems: NavItem[] = [
  { name: "Vue d'ensemble", href: '/dashboard/admin?tab=overview', icon: LayoutDashboard },
  { name: 'Vérifications', href: '/dashboard/admin?tab=verification', icon: BadgeCheck },
  { name: 'Litiges', href: '/dashboard/admin?tab=disputes', icon: Flag },
  { name: 'Modération', href: '/dashboard/admin?tab=moderation', icon: ShieldCheck },
  { name: 'Catégories', href: '/dashboard/admin?tab=categories', icon: Layers },
  { name: 'Payouts', href: '/dashboard/admin?tab=payouts', icon: Coins },
];

function SidebarContent({
  userRole,
  currentPath,
  currentAdminTab,
  onNavigate,
}: {
  userRole: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  currentPath: string;
  currentAdminTab?: string;
  onNavigate?: () => void;
}) {
  const navItems =
    userRole === 'ADMIN'
      ? adminNavItems
      : userRole === 'PROVIDER'
        ? providerNavItems
        : clientNavItems;

  const isItemActive = (href: string) => {
    if (userRole === 'ADMIN') {
      const [path, query] = href.split('?tab=');
      if (path === '/dashboard/admin') {
        return currentPath === path && (query ?? 'overview') === (currentAdminTab ?? 'overview');
      }
    }

    if (href === currentPath) return true;
    // Exact match on dashboard roots so they don't swallow sibling routes
    // (e.g. /pro/earnings shouldn't also light up /pro).
    if (
      href === '/pro' ||
      href === '/dashboard/client' ||
      href === '/dashboard/provider' ||
      href === '/dashboard/admin'
    ) {
      return currentPath === href;
    }
    return currentPath.startsWith(href + '/');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-4 py-4 border-b">
        <Image
          src="/kayou-logo-transparent.png"
          alt="KAYOU"
          width={216}
          height={90}
          className="h-8 w-auto"
        />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'h-5 px-1.5 text-xs',
                      isActive && 'bg-primary-foreground/20 text-primary-foreground',
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {userRole === 'PROVIDER' && (
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-sm text-amber-900">Passez Premium</span>
            </div>
            <p className="text-xs text-amber-700 mb-3">
              Boostez votre visibilité et obtenez plus de clients.
            </p>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              Découvrir
            </Button>
          </div>
        )}

        {userRole === 'ADMIN' && (
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-sm text-red-900">Mode Admin</span>
            </div>
            <p className="text-xs text-red-700">
              Vous avez accès à toutes les fonctionnalités d&apos;administration.
            </p>
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-3">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <HelpCircle className="h-5 w-5" />
          <span>Aide &amp; Support</span>
        </Link>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  mobileTitle = 'KAYOU',
}: {
  children: React.ReactNode;
  mobileTitle?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <AppShellInner mobileTitle={mobileTitle}>{children}</AppShellInner>
    </Suspense>
  );
}

function AppShellInner({
  children,
  mobileTitle = 'KAYOU',
}: {
  children: React.ReactNode;
  mobileTitle?: string;
}) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const userRole = user.role as 'CLIENT' | 'PROVIDER' | 'ADMIN';
  const currentAdminTab = searchParams.get('tab') ?? 'overview';

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r bg-background">
        <SidebarContent
          userRole={userRole}
          currentPath={pathname}
          currentAdminTab={currentAdminTab}
        />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent
            userRole={userRole}
            currentPath={pathname}
            currentAdminTab={currentAdminTab}
            onNavigate={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <h1 className="lg:hidden text-lg font-semibold">{mobileTitle}</h1>

            <div className="hidden lg:flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                  3
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2 pr-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {(user.firstName ?? '').charAt(0)}
                        {(user.lastName ?? '').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium leading-none">
                        {user.firstName ?? ''} {user.lastName ?? ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {userRole === 'ADMIN'
                          ? 'Administrateur'
                          : userRole === 'PROVIDER'
                            ? 'Prestataire'
                            : 'Client'}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>
                        {user.firstName ?? ''} {user.lastName ?? ''}
                      </span>
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
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
