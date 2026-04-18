'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  Star,
  Settings,
  User,
  Bell,
  LogOut,
  Menu,
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  Wallet,
  HelpCircle,
  ChevronDown,
  Crown,
  Shield,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: typeof Home;
  badge?: number;
}

const clientNavItems: NavItem[] = [
  { name: 'Tableau de bord', href: '/dashboard/client', icon: LayoutDashboard },
  { name: 'Mes réservations', href: '/bookings', icon: Calendar },
  { name: 'Favoris', href: '/dashboard/client/favorites', icon: Star },
  { name: 'Messages', href: '/dashboard/client/messages', icon: MessageSquare },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];

const providerNavItems: NavItem[] = [
  { name: 'Tableau de bord', href: '/dashboard/provider', icon: LayoutDashboard },
  { name: 'Mes réservations', href: '/bookings', icon: Calendar },
  { name: 'Mon profil', href: '/dashboard/provider/profile', icon: User },
  { name: 'Services', href: '/dashboard/provider/services', icon: Briefcase },
  { name: 'Messages', href: '/dashboard/provider/messages', icon: MessageSquare },
  { name: 'Avis', href: '/dashboard/provider/reviews', icon: Star },
  { name: 'Statistiques', href: '/dashboard/provider/stats', icon: TrendingUp },
  { name: 'Paiements', href: '/dashboard/provider/payments', icon: Wallet },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];

const adminNavItems: NavItem[] = [
  { name: 'Tableau de bord', href: '/dashboard/admin', icon: LayoutDashboard },
  { name: 'Utilisateurs', href: '/dashboard/admin/users', icon: Users },
  { name: 'Prestataires', href: '/dashboard/admin/providers', icon: Briefcase },
  { name: 'Réservations', href: '/bookings', icon: Calendar },
  { name: 'Catégories', href: '/dashboard/admin/categories', icon: Briefcase },
  { name: 'Statistiques', href: '/dashboard/admin/stats', icon: TrendingUp },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];

function SidebarContent({
  userRole,
  currentPath,
  onNavigate,
}: {
  userRole: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  currentPath: string;
  onNavigate?: () => void;
}) {
  const navItems =
    userRole === 'ADMIN'
      ? adminNavItems
      : userRole === 'PROVIDER'
        ? providerNavItems
        : clientNavItems;

  const isItemActive = (href: string) => {
    if (href === currentPath) return true;
    // Exact match on dashboard root so it doesn't swallow sibling routes.
    if (href === '/dashboard/client' || href === '/dashboard/provider' || href === '/dashboard/admin') {
      return currentPath === href;
    }
    return currentPath.startsWith(href + '/');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <Image
          src="/kayou-logo.png"
          alt="KAYOU"
          width={32}
          height={32}
          className="h-8 w-auto"
        />
        <span className="text-xl font-bold text-primary">KAYOU</span>
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
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r bg-background">
        <SidebarContent userRole={userRole} currentPath={pathname} />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent
            userRole={userRole}
            currentPath={pathname}
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
                    <Link
                      href={
                        userRole === 'PROVIDER'
                          ? '/dashboard/provider/profile'
                          : '/dashboard/settings'
                      }
                    >
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
