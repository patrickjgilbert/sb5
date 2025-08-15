import { z } from "zod";

export const TimeRange = z.string().regex(
  /^(\d{2}:\d{2}-\d{2}:\d{2}|<\d{2}:\d{2}|>=\d{2}:\d{2})$/
);

export const NormalizedAvailability = z.object({
  participant_name: z.string(),
  available_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).default([]),
  unavailable_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).default([]),
  partial_constraints: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    ideal: z.array(TimeRange).default([]),
    ok: z.array(TimeRange).default([]),
    avoid: z.array(TimeRange).default([]),
  })).default([]),
  global_time_prefs: z.array(z.record(z.any())).default([]),
  inference_flags: z.object({
    assumed_flexible_elsewhere: z.boolean().default(false),
    expanded_ranges: z.array(z.string()).default([]), // "YYYY-MM-DD..YYYY-MM-DD"
    weekday_expansions: z.array(z.object({
      weekday: z.enum(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]),
      dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    })).default([]),
  }).default({}),
  notes: z.string().optional(),
});

export type NormalizedAvailabilityT = z.infer<typeof NormalizedAvailability>; 