"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";
import { notFoundCopy } from "@/copy/notFound";

export function NotFoundContent() {
  const pathname = usePathname() ?? "/";
  return (
    <div className="mobile-page max-w-md py-16 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
        <Compass size={28} aria-hidden />
      </span>
      <h1 className="mt-6">{notFoundCopy.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {notFoundCopy.description} <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs break-all text-foreground">{pathname}</code>
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/" className="primary-action">
          {notFoundCopy.home}
        </Link>
        <Link href="/rechercher" className="secondary-action">
          {notFoundCopy.search}
        </Link>
      </div>
    </div>
  );
}
