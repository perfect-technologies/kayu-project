"use client";

import { useMemo } from "react";
import { SCHEDULE_LIMITS, validateSchedule, type ScheduleException, type ScheduleIssue, type ScheduleRule, type ScheduleTimezone } from "@kayu/utils";
import { onboardingCopy } from "@/copy/onboarding";
import { cn } from "@/lib/utils";
import { ExceptionRow } from "./ExceptionRow";
import { RangeRow } from "./RangeRow";

const copy = onboardingCopy.schedule;
const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240];
const BUFFERS = [0, 15, 30, 45, 60];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export type ScheduleValue = {
  timezone: ScheduleTimezone;
  slotDurationMin: number;
  slotBufferMin: number;
  rules: ScheduleRule[];
  exceptions: ScheduleException[];
};

export function defaultSchedule(): ScheduleValue {
  const rules: ScheduleRule[] = [];
  for (const day of [1, 2, 3, 4, 5, 6]) {
    rules.push({ dayOfWeek: day, startTime: "08:00", endTime: "12:00" }, { dayOfWeek: day, startTime: "14:00", endTime: "18:00" });
  }
  return { timezone: "Africa/Kinshasa", slotDurationMin: 60, slotBufferMin: 0, rules, exceptions: [] };
}

export function scheduleIssues(value: ScheduleValue): ScheduleIssue[] {
  const result = validateSchedule(value);
  return result.ok ? [] : result.errors;
}

function nextRange(existing: ScheduleRule[]): { startTime: string; endTime: string } {
  const last = existing[existing.length - 1];
  if (!last) return { startTime: "08:00", endTime: "12:00" };
  const [hour] = last.endTime.split(":").map(Number);
  const start = Math.min((hour ?? 8) + 1, 21);
  return { startTime: `${String(start).padStart(2, "0")}:00`, endTime: `${String(Math.min(start + 3, 23)).padStart(2, "0")}:00` };
}

export type ScheduleEditorProps = {
  value: ScheduleValue;
  onChange: (next: ScheduleValue) => void;
  className?: string;
};

/**
 * Timezone, seven weekday rows (switch + up to four ranges), slot duration and buffer, exceptions.
 * Client rules mirror the server (`validateSchedule`): ordered, non-overlapping ranges, one exception per date.
 */
export function ScheduleEditor({ value, onChange, className }: ScheduleEditorProps) {
  const issues = useMemo(() => scheduleIssues(value), [value]);
  const ruleErrors = new Map<number, string>();
  const exceptionErrors = new Map<number, string>();
  const general: string[] = [];
  for (const issue of issues) {
    if (issue.path[0] === "rules" && typeof issue.path[1] === "number") ruleErrors.set(issue.path[1], issue.message);
    else if (issue.path[0] === "exceptions" && typeof issue.path[1] === "number") exceptionErrors.set(issue.path[1], issue.message);
    else general.push(issue.message);
  }

  const setRulesForDay = (day: number, ranges: Array<{ startTime: string; endTime: string }>) => {
    const others = value.rules.filter((rule) => rule.dayOfWeek !== day);
    onChange({ ...value, rules: [...others, ...ranges.map((range) => ({ dayOfWeek: day, ...range }))] });
  };

  const copyWeek = () => {
    const monday = value.rules.filter((rule) => rule.dayOfWeek === 1).map(({ startTime, endTime }) => ({ startTime, endTime }));
    const weekend = value.rules.filter((rule) => rule.dayOfWeek === 0 || rule.dayOfWeek === 6);
    const week = [1, 2, 3, 4, 5].flatMap((day) => monday.map((range) => ({ dayOfWeek: day, ...range })));
    onChange({ ...value, rules: [...week, ...weekend] });
  };

  const addException = () => {
    if (value.exceptions.length >= SCHEDULE_LIMITS.maxExceptions) return;
    onChange({ ...value, exceptions: [...value.exceptions, { date: "", isOpen: false, startTime: null, endTime: null, reason: null }] });
  };

  return (
    <section className={cn("space-y-4 rounded-3xl border border-border bg-white p-4", className)}>
      <h3 className="text-base font-extrabold">{copy.title}</h3>
      <label className="block text-xs font-bold">
        {copy.timezone}
        <select value={value.timezone} onChange={(event) => onChange({ ...value, timezone: event.target.value as ScheduleTimezone })} className="field mt-1">
          {SCHEDULE_LIMITS.timezones.map((zone) => (
            <option key={zone} value={zone}>
              {copy.timezones[zone]}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="min-w-0 text-xs font-bold">
          {copy.duration}
          <select value={value.slotDurationMin} onChange={(event) => onChange({ ...value, slotDurationMin: Number(event.target.value) })} className="field mt-1">
            {DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {copy.minutes(minutes)}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-xs font-bold">
          {copy.buffer}
          <select value={value.slotBufferMin} onChange={(event) => onChange({ ...value, slotBufferMin: Number(event.target.value) })} className="field mt-1">
            {BUFFERS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {copy.minutes(minutes)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-muted-foreground">{copy.durationHint}</p>

      <div className="space-y-2">
        {DAY_ORDER.map((day) => {
          const label = copy.days[day]!;
          const entries = value.rules.map((rule, index) => ({ rule, index })).filter(({ rule }) => rule.dayOfWeek === day);
          const open = entries.length > 0;
          return (
            <div key={day} className="rounded-2xl bg-secondary/50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="flex min-h-9 items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={open}
                    aria-label={copy.open(label)}
                    checked={open}
                    onChange={(event) => setRulesForDay(day, event.target.checked ? [{ startTime: "08:00", endTime: "18:00" }] : [])}
                    className="size-4 accent-primary"
                  />
                  {label}
                </label>
                {day === 1 && open && (
                  <button type="button" onClick={copyWeek} className="inline-flex min-h-9 items-center text-xs font-bold text-primary">
                    {copy.copyWeek}
                  </button>
                )}
              </div>
              {open ? (
                <div className="space-y-2">
                  {entries.map(({ rule, index }, position) => (
                    <div key={`${day}-${position}`}>
                      <RangeRow
                        value={rule}
                        invalid={ruleErrors.has(index)}
                        onChange={(range) =>
                          setRulesForDay(
                            day,
                            entries.map((entry, at) => (at === position ? range : { startTime: entry.rule.startTime, endTime: entry.rule.endTime })),
                          )
                        }
                        onRemove={() => setRulesForDay(day, entries.filter((_, at) => at !== position).map(({ rule: kept }) => ({ startTime: kept.startTime, endTime: kept.endTime })))}
                      />
                      {ruleErrors.has(index) && (
                        <p role="alert" className="mt-1 text-xs font-semibold text-destructive">
                          {ruleErrors.get(index)}
                        </p>
                      )}
                    </div>
                  ))}
                  {entries.length < SCHEDULE_LIMITS.maxRangesPerDay ? (
                    <button
                      type="button"
                      onClick={() => setRulesForDay(day, [...entries.map(({ rule }) => ({ startTime: rule.startTime, endTime: rule.endTime })), nextRange(entries.map(({ rule }) => rule))])}
                      className="inline-flex min-h-9 items-center text-xs font-bold text-primary"
                    >
                      {copy.addRange}
                    </button>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">{copy.maxRanges(SCHEDULE_LIMITS.maxRangesPerDay)}</p>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">{copy.closed}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-bold">{copy.exceptions}</h4>
        {value.exceptions.map((exception, index) => (
          <ExceptionRow
            key={index}
            value={exception}
            error={exceptionErrors.get(index) ?? null}
            onChange={(next) => onChange({ ...value, exceptions: value.exceptions.map((item, at) => (at === index ? next : item)) })}
            onRemove={() => onChange({ ...value, exceptions: value.exceptions.filter((_, at) => at !== index) })}
          />
        ))}
        {value.exceptions.length < SCHEDULE_LIMITS.maxExceptions && (
          <button type="button" onClick={addException} className="inline-flex min-h-9 items-center text-xs font-bold text-primary">
            {copy.addException}
          </button>
        )}
      </div>

      {general.length > 0 && (
        <div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-bold">{copy.errorsTitle}</p>
          <ul className="mt-1 list-disc pl-5">
            {general.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
