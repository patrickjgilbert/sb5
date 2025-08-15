import { addDays, parseISO, isAfter, formatISO } from "date-fns";

export function expandInclusiveRange(startISO: string, endISO: string): string[] {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (isAfter(start, end)) return [];
  const out: string[] = [];
  for (let d = start; !isAfter(d, end); d = addDays(d, 1)) {
    out.push(formatISO(d, { representation: "date" }));
  }
  return out;
} 