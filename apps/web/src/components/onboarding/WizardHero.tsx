import { onboardingCopy } from "@/copy/onboarding";

/** Emerald hero card with an accent orb; the circular photo shows from `sm` up. */
export function WizardHero() {
  const copy = onboardingCopy.hero;
  return (
    <section className="relative mt-5 overflow-hidden rounded-3xl bg-primary p-6 text-white shadow-soft sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-accent/20 blur-2xl" />
      <div className="relative flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl leading-tight font-extrabold text-white sm:text-3xl">{copy.title}</h1>
          <p className="mt-2 text-sm text-white/70 sm:text-base">{copy.subtitle}</p>
        </div>
        <div className="hidden size-28 shrink-0 overflow-hidden rounded-full bg-accent/20 ring-4 ring-accent/30 sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/wizard-hero.png" alt="" className="size-full object-cover" />
        </div>
      </div>
    </section>
  );
}
