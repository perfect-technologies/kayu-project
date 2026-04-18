"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
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
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Trouver un pro", href: "/services" },
  { name: "Catégories", href: "/services" },
  { name: "Comment ça marche", href: "/#how-it-works" },
  { name: "Devenir pro", href: "/services" },
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

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U"
    : "U";

  const dashboardHref =
    user?.role === "ADMIN"
      ? "/dashboard/admin"
      : user?.role === "PROVIDER"
        ? "/dashboard/provider"
        : "/dashboard/client";

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          background: "rgba(250,250,249,0.85)",
          backdropFilter: "saturate(140%) blur(8px)",
          WebkitBackdropFilter: "saturate(140%) blur(8px)",
          borderBottom: "1px solid var(--k-border)",
        }}
      >
        <div className="mx-auto flex max-w-[1240px] items-center gap-6 px-5 py-3.5 md:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/kayou-logo-transparent.png"
              alt="KAYOU"
              width={30}
              height={30}
              className="h-[30px] w-auto"
              priority
            />
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: "-0.02em",
                color: "var(--k-text-primary)",
              }}
            >
              KAYOU
            </span>
          </Link>

          <nav className="hidden flex-1 items-center gap-7 lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[14px] font-medium transition-colors"
                style={{ color: "var(--k-text-body)" }}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="k-btn k-btn-secondary h-10 gap-2 pl-1.5 pr-3">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.avatar || undefined} />
                    <AvatarFallback
                      style={{
                        background: "var(--k-primary-subtle)",
                        color: "var(--k-primary-hover)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-[13px] xl:inline">{user?.firstName}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={dashboardHref} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Tableau de bord
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === "CLIENT" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/client" className="cursor-pointer">
                        <Calendar className="mr-2 h-4 w-4" />
                        Mes réservations
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === "CLIENT" && (
                    <DropdownMenuItem asChild>
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
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                    style={{ color: "var(--k-danger)" }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <button
                  className="k-btn k-btn-ghost"
                  onClick={() => setLoginOpen(true)}
                >
                  Se connecter
                </button>
                <button
                  className="k-btn k-btn-primary"
                  onClick={() => setRegisterOpen(true)}
                >
                  S&apos;inscrire
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="ml-auto p-2 lg:hidden"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            style={{ color: "var(--k-text-primary)" }}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 lg:hidden",
            mobileMenuOpen ? "max-h-[32rem]" : "max-h-0",
          )}
          style={{ borderTop: mobileMenuOpen ? "1px solid var(--k-border)" : "none", background: "var(--k-surface)" }}
        >
          <div className="mx-auto max-w-[1240px] space-y-3 px-5 py-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-[var(--k-r-md)] px-3 py-3 text-[15px] font-medium"
                  style={{ color: "var(--k-text-primary)" }}
                >
                  <span>{item.name}</span>
                  <ChevronDown className="h-4 w-4 -rotate-90 opacity-40" />
                </Link>
              ))}
            </div>

            <div
              className="flex flex-col gap-2 pt-3"
              style={{ borderTop: "1px solid var(--k-border-subtle)" }}
            >
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar || undefined} />
                      <AvatarFallback
                        style={{
                          background: "var(--k-primary-subtle)",
                          color: "var(--k-primary-hover)",
                        }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs" style={{ color: "var(--k-text-muted)" }}>
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    className="k-btn k-btn-secondary w-full"
                    onClick={() => {
                      router.push(dashboardHref);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Tableau de bord
                  </button>
                  <button
                    className="k-btn k-btn-secondary w-full"
                    style={{ color: "var(--k-danger)" }}
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="k-btn k-btn-secondary w-full"
                    onClick={() => {
                      setLoginOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Se connecter
                  </button>
                  <button
                    className="k-btn k-btn-primary w-full"
                    onClick={() => {
                      setRegisterOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    S&apos;inscrire
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToRegister={() => {
          setLoginOpen(false);
          setRegisterOpen(true);
        }}
      />
      <RegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSwitchToLogin={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
      />
    </>
  );
}
