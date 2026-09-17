import Link from "next/link";
import { shellCopy } from "@/copy/shell";
import { Logo } from "./Logo";

/** Shell-less canvas for /login, /register, /bienvenue, /premium and the terms screen. */
export function AuthCanvas({
  children,
  topBar = false,
  skipHref = "/login",
  className = "",
}: {
  children: React.ReactNode;
  /** Logo left and a "Passer" link right, for the welcome carousel. */
  topBar?: boolean;
  skipHref?: string;
  className?: string;
}) {
  return (
    <main className={`auth-canvas ${topBar ? "auth-canvas--bar" : ""}`.trim()}>
      {topBar && (
        <div className="auth-canvas__bar">
          <Link href="/" aria-label={shellCopy.nav.home}>
            <Logo size={28} />
          </Link>
          <Link href={skipHref} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            {shellCopy.canvas.skip}
          </Link>
        </div>
      )}
      <section className={`auth-card ${className}`.trim()}>{children}</section>
    </main>
  );
}
