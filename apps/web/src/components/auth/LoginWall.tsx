"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, LogIn, UserPlus } from "lucide-react";
import { providerCopy } from "@/copy/provider";
import { loginPath, registerPath } from "@/lib/auth-redirects";
import { cn } from "@/lib/utils";

const copy = providerCopy.loginWall;

/** Shown to anonymous visitors where contacts, booking or reviews live; returns them to this page after sign-in. */
export function LoginWall({ message, className }: { message?: string; className?: string }) {
  const pathname = usePathname() ?? "/";
  return (
    <div className={cn("rounded-2xl border border-primary/10 bg-primary/5 p-5 text-center", className)}>
      <span className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Lock size={20} aria-hidden />
      </span>
      <p className="text-sm font-semibold text-foreground">{message ?? copy.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{copy.description}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link
          href={loginPath(pathname)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground"
        >
          <LogIn size={15} aria-hidden /> {copy.login}
        </Link>
        <Link
          href={registerPath(pathname)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary/30 bg-white px-4 text-sm font-bold text-primary"
        >
          <UserPlus size={15} aria-hidden /> {copy.register}
        </Link>
      </div>
    </div>
  );
}
