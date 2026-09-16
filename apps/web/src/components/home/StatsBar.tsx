import type { PublicStatsResponse } from "@kayu/schemas";
import { homeCopy } from "@/copy/home";

const copy = homeCopy.stats;

/** Four plain-text figures; "—" when the stats call failed (no skeleton, no spinner). */
export function StatsBar({ stats }: { stats: PublicStatsResponse | null }) {
  const cells = [
    { value: stats ? String(stats.categories) : copy.unavailable, label: copy.categories },
    { value: stats ? String(stats.countries) : copy.unavailable, label: copy.countries },
    { value: copy.cities, label: copy.citiesLabel },
    { value: copy.local, label: copy.localLabel },
  ];
  return (
    <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-6">
      <dl className="grid grid-cols-2 gap-6 rounded-3xl border border-border bg-white p-6 shadow-soft motion-safe:animate-fade-up sm:grid-cols-4 sm:p-8">
        {cells.map((cell) => (
          <div className="text-center" key={cell.label}>
            <dd className="text-2xl font-extrabold text-primary sm:text-3xl">{cell.value}</dd>
            <dt className="mt-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{cell.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
