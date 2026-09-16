import { z } from "zod";
import { DateOnlySchema, TimeOfDaySchema } from "./common";

export const SCHEDULE_LIMITS = {
  maxRangesPerDay: 4,
  maxExceptions: 90,
  bookingWindowDays: 90,
  slotDurationMin: { min: 15, max: 240 },
  slotBufferMin: { min: 0, max: 60 },
  timezones: ["Africa/Kinshasa", "Africa/Lubumbashi", "Africa/Brazzaville"] as const,
} as const;

export const TimezoneSchema = z.enum(SCHEDULE_LIMITS.timezones);

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

export const toMinutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

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
    for (let day = 0; day <= 6; day += 1) {
      const ranges = schedule.rules
        .map((rule, index) => ({ rule, index }))
        .filter(({ rule }) => rule.dayOfWeek === day)
        .sort((a, b) => toMinutes(a.rule.startTime) - toMinutes(b.rule.startTime));

      if (ranges.length > SCHEDULE_LIMITS.maxRangesPerDay) {
        ctx.addIssue({
          code: "custom",
          path: ["rules"],
          message: `${SCHEDULE_LIMITS.maxRangesPerDay} plages maximum par jour`,
        });
      }

      let previousEnd = -1;
      for (const { rule, index } of ranges) {
        const start = toMinutes(rule.startTime);
        const end = toMinutes(rule.endTime);
        if (end - start < schedule.slotDurationMin) {
          ctx.addIssue({
            code: "custom",
            path: ["rules", index],
            message: "La plage doit contenir au moins un créneau",
          });
        }
        if (start < previousEnd) {
          ctx.addIssue({
            code: "custom",
            path: ["rules", index],
            message: "Les plages d'un même jour ne doivent pas se chevaucher",
          });
        }
        previousEnd = Math.max(previousEnd, end);
      }
    }

    const seen = new Set<string>();
    schedule.exceptions.forEach((exception, index) => {
      if (seen.has(exception.date)) {
        ctx.addIssue({
          code: "custom",
          path: ["exceptions", index, "date"],
          message: "Une seule exception par date",
        });
      }
      seen.add(exception.date);

      if (exception.isOpen) {
        if (!exception.startTime || !exception.endTime) {
          ctx.addIssue({
            code: "custom",
            path: ["exceptions", index],
            message: "Une ouverture exceptionnelle exige une plage horaire",
          });
          return;
        }
        if (toMinutes(exception.endTime) - toMinutes(exception.startTime) < schedule.slotDurationMin) {
          ctx.addIssue({
            code: "custom",
            path: ["exceptions", index],
            message: "La plage doit contenir au moins un créneau",
          });
        }
      } else if (exception.startTime || exception.endTime) {
        ctx.addIssue({
          code: "custom",
          path: ["exceptions", index],
          message: "Un jour fermé ne porte pas de plage horaire",
        });
      }
    });
  });

export type ScheduleInput = z.infer<typeof ScheduleInputSchema>;
