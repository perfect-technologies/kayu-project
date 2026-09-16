import { CalendarDays, MapPin, MessageSquare } from "lucide-react";
import { onboardingCopy } from "@/copy/onboarding";

/** Emerald benefits card with three icon columns (payments do not exist, so no "paid safely" line). */
export function BenefitsCard() {
  const copy = onboardingCopy.public.benefits;
  const items = [
    { Icon: MessageSquare, label: copy.requests },
    { Icon: CalendarDays, label: copy.schedule },
    { Icon: MapPin, label: copy.visible },
  ];
  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-xs font-bold text-emerald-800">{copy.title}</p>
      <ul className="mt-3 grid grid-cols-3 gap-2 text-center">
        {items.map(({ Icon, label }) => (
          <li key={label} className="flex flex-col items-center gap-1">
            <span className="flex size-9 items-center justify-center rounded-full bg-white text-emerald-700 shadow-soft">
              <Icon size={16} aria-hidden />
            </span>
            <span className="text-[10px] font-semibold text-emerald-800">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
