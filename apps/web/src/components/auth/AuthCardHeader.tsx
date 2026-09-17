import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { shellCopy } from "@/copy/shell";

/** Centred logo, optional eyebrow, H1 and subtitle at the top of the login and register cards. */
export function AuthCardHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle: string }) {
  return (
    <header className="text-center">
      <Link href="/" className="inline-flex" aria-label={shellCopy.nav.home}>
        <Logo size={60} />
      </Link>
      {eyebrow && <p className="mt-8 text-[10px] font-extrabold tracking-[.19em] text-primary/70 uppercase">{eyebrow}</p>}
      <h1 className={`${eyebrow ? "mt-2" : "mt-8"} text-[28px] leading-tight font-extrabold tracking-tight`}>{title}</h1>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
    </header>
  );
}
