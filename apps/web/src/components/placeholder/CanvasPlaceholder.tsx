import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { shellCopy } from "@/copy/shell";

/** Auth-canvas variant of RoutePlaceholder for /login, /register, /bienvenue and /premium. */
export function CanvasPlaceholder({ title, workstream }: { title: string; workstream: "05" | "06" }) {
  const copy = shellCopy.placeholder;
  return (
    <>
      <Link href="/" className="flex justify-center" aria-label={shellCopy.nav.home}>
        <Logo size={60} />
      </Link>
      <p className="mt-8 text-[10px] font-extrabold tracking-[.19em] text-muted-foreground uppercase">{copy.eyebrow}</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{copy.description(workstream)}</p>
      <Link href="/" className="primary-action mt-8">
        {copy.back}
      </Link>
    </>
  );
}
