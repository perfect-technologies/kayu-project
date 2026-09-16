import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck, LayoutGrid, Search, Star, UserPlus } from "lucide-react";
import { shellCopy } from "@/copy/shell";

export const dynamic = "force-dynamic";

const trustIcons = [BadgeCheck, Star, CalendarCheck] as const;

/** Placeholder home: exercises the shell at 320 / 390 / 1440 px until workstream 05 lands the real one. */
export default function HomePage() {
  const copy = shellCopy.homePlaceholder;
  const tiles = [
    { href: "/rechercher", icon: Search, ...copy.tiles.search },
    { href: "/services", icon: LayoutGrid, ...copy.tiles.services },
    { href: "/prestataire/nouveau", icon: UserPlus, ...copy.tiles.provider },
  ];

  return (
    <div className="mesh-bg">
      <section className="mobile-page max-w-7xl pt-8 sm:pt-14">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary">
          {copy.eyebrow}
        </span>
        <h1 className="mt-5 max-w-3xl text-3xl leading-[1.15] font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          {copy.title} <span className="gradient-text">{copy.titleAccent}</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">{copy.subtitle}</p>

        <form action="/rechercher" method="get" className="mt-7 flex max-w-2xl items-center gap-2 rounded-full border border-border bg-white p-1.5 pl-3 shadow-soft">
          <label className="flex min-w-0 flex-1 items-center gap-2">
            <Search size={18} aria-hidden className="shrink-0 text-muted-foreground" />
            <span className="sr-only">{copy.searchPlaceholder}</span>
            <input
              name="q"
              type="search"
              placeholder={copy.searchPlaceholder}
              className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <button type="submit" aria-label={copy.searchAction} className="icon-button border-transparent bg-primary text-primary-foreground">
            <ArrowRight size={18} aria-hidden />
          </button>
        </form>

        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
          {copy.trust.map((label, index) => {
            const Icon = trustIcons[index] ?? BadgeCheck;
            return (
              <li key={label} className="inline-flex items-center gap-1.5">
                <Icon size={14} aria-hidden className={index === 1 ? "text-amber-400" : "text-primary"} />
                {label}
              </li>
            );
          })}
        </ul>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {tiles.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href} className="metric-card flex items-start gap-3 transition hover:bg-secondary">
              <span className="metric-card__icon shrink-0">
                <Icon size={20} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-extrabold text-foreground">{title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
