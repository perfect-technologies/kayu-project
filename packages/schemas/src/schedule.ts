import { SCHEDULE_LIMITS, toMinutes, validateSchedule } from "@kayu/utils";
import { z } from "zod";
import { DateOnlySchema } from "./common.js";

export { SCHEDULE_LIMITS, toMinutes };

export const TimezoneSchema = z.enum(SCHEDULE_LIMITS.timezones);

export const TimeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure attendue au format HH:mm");

export const ScheduleRuleInput = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: TimeOfDaySchema,
  endTime: TimeOfDaySchema,
});

export const ScheduleExceptionInput = z.object({
  date: DateOnlySchema,
  isOpen: z.boolean(),
  startTime: TimeOfDaySchema.nullable().optional(),
  endTime: TimeOfDaySchema.nullable().optional(),
  reason: z.string().trim().max(200).nullable().optional(),
});

// Shape checks live here; the cross-field rules (ranges per day, overlap, a slot per range,
// one exception per date) come from the same `validateSchedule` the web editor runs.
export const ScheduleInputSchema = z
  .object({
    timezone: TimezoneSchema,
    slotDurationMin: z
      .number()
      .int()
      .min(SCHEDULE_LIMITS.slotDurationMin.min)
      .max(SCHEDULE_LIMITS.slotDurationMin.max),
    slotBufferMin: z
      .number()
      .int()
      .min(SCHEDULE_LIMITS.slotBufferMin.min)
      .max(SCHEDULE_LIMITS.slotBufferMin.max),
    rules: z.array(ScheduleRuleInput).max(7 * SCHEDULE_LIMITS.maxRangesPerDay),
    exceptions: z.array(ScheduleExceptionInput).max(SCHEDULE_LIMITS.maxExceptions).default([]),
  })
  .superRefine((schedule, ctx) => {
    const result = validateSchedule(schedule);
    if (result.ok) return;
    // Zod keeps refining after field-level failures; skip what it already reported for that field.
    const reported = ctx.issues.map((issue) => (issue.path ?? []).join("."));
    for (const issue of result.errors) {
      const key = issue.path.join(".");
      const covered = reported.some(
        (path) => path === key || (issue.path.length > 1 && path.startsWith(`${key}.`)),
      );
      if (!covered) ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
    }
  });

export type ScheduleRuleInput = z.infer<typeof ScheduleRuleInput>;
export type ScheduleExceptionInput = z.infer<typeof ScheduleExceptionInput>;
export type ScheduleInput = z.infer<typeof ScheduleInputSchema>;
