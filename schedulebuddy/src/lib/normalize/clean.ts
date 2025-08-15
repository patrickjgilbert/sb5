import { parseISO, isAfter, isBefore, isEqual } from "date-fns";
import { NormalizedAvailability } from "@/lib/types/availability";

export function cleanNormalized(json: unknown, windowStart: string, windowEnd: string) {
  const parsed = NormalizedAvailability.parse(json);

  const start = parseISO(windowStart);
  const end = parseISO(windowEnd);

  const inWindow = (iso: string) => {
    const d = parseISO(iso);
    const geStart = isEqual(d, start) || isAfter(d, start);
    const leEnd   = isEqual(d, end)   || isBefore(d, end);
    return geStart && leEnd;
  };

  const uniqSort = (arr: string[]) => [...new Set(arr.filter(inWindow))].sort();
  const available = uniqSort(parsed.available_dates);
  const unavailable = uniqSort(parsed.unavailable_dates).filter(d => !available.includes(d));

  parsed.available_dates = available;
  parsed.unavailable_dates = unavailable;
  parsed.partial_constraints = parsed.partial_constraints.filter((pc: any) => inWindow(pc.date));

  return parsed;
} 