import { Clock } from "lucide-react";
import type { AvailabilityException, ScheduleSummary as ScheduleSummaryDto } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";

const copy = providerCopy.schedule;
const ORDER = [1, 2, 3, 4, 5, 6, 0];

function formatDay(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`));
}

/** Weekday ranges ("Lun 08:00–12:00 · 14:00–18:00"), closed days muted, next three exceptions. Server-safe. */
export function ScheduleSummary({
  summary,
  exceptions,
  today,
}: {
  summary: ScheduleSummaryDto;
  exceptions: AvailabilityException[];
  /** `YYYY-MM-DD` in the provider timezone. */
  today: string;
}) {
  const byDay = new Map(summary.map((day) => [day.dayOfWeek, day.ranges]));
  const upcoming = exceptions
    .filter((exception) => exception.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-soft">
      <h2 className="mb-2 flex items-center gap-2 text-base font-extrabold text-foreground">
        <Clock size={16} aria-hidden className="text-primary" /> {copy.title}
      </h2>
      <dl className="space-y-1 text-sm">
        {ORDER.map((day) => {
          const ranges = byDay.get(day) ?? [];
          return (
            <div key={day} className="flex justify-between gap-3">
              <dt className="w-10 shrink-0 font-semibold text-foreground">{copy.days[day]}</dt>
              <dd className={ranges.length === 0 ? "text-muted-foreground/70" : "text-right text-foreground/80"}>
                {ranges.length === 0 ? copy.closed : ranges.map((range) => `${range.startTime}–${range.endTime}`).join(" · ")}
              </dd>
            </div>
          );
        })}
      </dl>
      {upcoming.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{copy.exceptions}</p>
          <ul className="mt-1 space-y-1 text-sm">
            {upcoming.map((exception) => (
              <li key={exception.date} className="flex justify-between gap-3">
                <span className="font-semibold text-foreground">{formatDay(exception.date)}</span>
                <span className={exception.isOpen ? "text-emerald-700" : "text-muted-foreground/70"}>
                  {exception.isOpen && exception.startTime && exception.endTime
                    ? copy.exceptionOpen(exception.startTime, exception.endTime)
                    : copy.exceptionClosed}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
