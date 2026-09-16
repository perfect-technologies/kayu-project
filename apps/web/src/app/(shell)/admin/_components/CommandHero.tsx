import { ShieldCheck } from "lucide-react";
import { adminCopy } from "@/copy/admin";

/** The dark emerald "CONTROL ROOM" panel with the orbit ring (hidden under 600 px). */
export function CommandHero() {
  const copy = adminCopy.overview;
  return (
    <section className="relative flex items-center justify-between gap-6 overflow-hidden rounded-[28px] bg-primary bg-[radial-gradient(ellipse_at_100%_100%,var(--color-emerald-700)_0,transparent_65%)] p-6 text-primary-foreground sm:p-9">
      <span aria-hidden className="pointer-events-none absolute -top-28 -right-20 size-[350px] rounded-full border border-white/10" />
      <div className="relative min-w-0">
        <p className="text-[11px] font-bold tracking-[.22em] text-emerald-200 uppercase">{copy.eyebrow}</p>
        <h2 className="mt-3 font-heading text-3xl leading-tight font-extrabold sm:text-4xl">
          {copy.title[0]}
          <br />
          {copy.title[1]}
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">{copy.subtitle}</p>
      </div>
      <div className="relative hidden size-[145px] shrink-0 place-items-center rounded-full border border-white/15 text-accent min-[600px]:grid">
        <span aria-hidden className="absolute inset-3 rounded-full border border-white/10" />
        <ShieldCheck size={70} strokeWidth={1} aria-hidden />
      </div>
    </section>
  );
}
