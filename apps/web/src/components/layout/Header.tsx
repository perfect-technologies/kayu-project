"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  MapPin,
  User,
  ChevronDown,
  LogOut,
  Settings,
  LayoutDashboard,
  Heart,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { RegisterDialog } from "@/components/auth/RegisterDialog";

const navigation = [
  { name: "Accueil", href: "/" },
  { name: "Services", href: "/services" },
  { name: "Comment ça marche", href: "/#how-it-works" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const getInitials = () => {
    if (user) {
      return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U";
    }
    return "U";
  };

  const getDashboardLink = () => {
    if (!user) return "/dashboard";
    switch (user.role) {
      case "ADMIN":
        return "/dashboard/admin";
      case "PROVIDER":
        return "/dashboard/provider";
      default:
        return "/dashboard/client";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          {/* Top bar with location - visible on larger screens */}
          <div className="hidden md:flex items-center justify-between py-2 text-sm border-b border-border/40">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Kinshasa</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-medium text-foreground">Brazzaville</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Disponible 24h/24, 7j/7</span>
            </div>
          </div>

          {/* Main navigation */}
          <nav className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/kayou-logo-transparent.png"
                alt="KAYOU - Trouver un service à proximité"
                width={140}
                height={48}
                className="h-12 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Desktop Auth buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 pl-2 pr-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden xl:inline">{user?.firstName}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={getDashboardLink()} className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Tableau de bord
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === "CLIENT" && (
                      <DropdownMenuItem asChild>
                        {/* /dashboard/client/bookings not yet implemented — links to client dashboard */}
                        <Link href="/dashboard/client" className="cursor-pointer">
                          <Calendar className="mr-2 h-4 w-4" />
                          Mes réservations
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user?.role === "CLIENT" && (
                      <DropdownMenuItem asChild>
                        {/* /dashboard/client/favorites not yet implemented — links to client dashboard */}
                        <Link href="/dashboard/client" className="cursor-pointer">
                          <Heart className="mr-2 h-4 w-4" />
                          Mes favoris
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Paramètres
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => setLoginOpen(true)}
                  >
                    <User className="h-4 w-4" />
                    Connexion
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setRegisterOpen(true)}
                  >
                    Inscription
                  </Button>
                </>
              )}
            </div>

            {/* Mobile location indicator */}
            <div className="flex md:hidden items-center gap-2 text-sm text-muted-foreground mr-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Kinshasa • Brazzaville</span>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </nav>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "lg:hidden border-t border-border/40 bg-background overflow-hidden transition-all duration-300 ease-in-out",
            mobileMenuOpen ? "max-h-96" : "max-h-0"
          )}
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center justify-between py-3 px-4 rounded-lg text-foreground hover:bg-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="font-medium">{item.name}</span>
                  <ChevronDown className="h-4 w-4 rotate-[-90deg] text-muted-foreground" />
                </Link>
              ))}
            </div>

            {/* Mobile Auth buttons */}
            <div className="flex flex-col gap-2 pt-4 border-t border-border/40">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      router.push(getDashboardLink());
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Tableau de bord
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      setLoginOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <User className="h-4 w-4" />
                    Connexion
                  </Button>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => {
                      setRegisterOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Inscription
                  </Button>
                </>
              )}
            </div>

            {/* Mobile availability */}
            <div className="text-center text-sm text-muted-foreground pt-2">
              Disponible 24h/24, 7j/7
            </div>
          </div>
        </div>
      </header>

      {/* Login Dialog */}
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToRegister={() => {
          setLoginOpen(false);
          setRegisterOpen(true);
        }}
      />

      {/* Register Dialog */}
      <RegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
      />
    </>
  );
}
