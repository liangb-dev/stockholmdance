import { CALENDAR_TIMEZONE } from "@/lib/site";

export type TodayEventStatus = "past" | "now" | "upcoming";

export type DanceKind = "bachata" | "salsa" | "kizomba" | "zouk";

const DANCE_KIND_PATTERNS: [DanceKind, RegExp][] = [
  ["bachata", /bachata/i],
  ["salsa", /salsa|mambo/i],
  ["kizomba", /kizomba/i],
  ["zouk", /zouk/i],
];

export type TodayEvent = {
  id: string;
  title: string;
  location: string;
  start: string;
  end: string;
  isAllDay: boolean;
  isRecurring: boolean;
};

export type TodayPayload = {
  events: TodayEvent[];
  label: string;
  dateKey: string;
  fetchedAt: string;
};

export function stockholmDateKey(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: CALENDAR_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function eventStatus(event: TodayEvent, now = new Date()): TodayEventStatus {
  const start = new Date(event.start);
  const end = new Date(event.end);

  if (end.getTime() <= now.getTime()) {
    return "past";
  }

  if (start.getTime() <= now.getTime()) {
    return "now";
  }

  return "upcoming";
}

function formatClock(isoDate: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: CALENDAR_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(isoDate));
}

export function formatEventClocks(event: TodayEvent) {
  if (event.isAllDay) {
    return { start: "All day", end: "" };
  }

  return { start: formatClock(event.start), end: formatClock(event.end) };
}

export function eventKind(title: string): DanceKind | null {
  let match: DanceKind | null = null;
  let earliest = Number.POSITIVE_INFINITY;

  for (const [kind, pattern] of DANCE_KIND_PATTERNS) {
    const index = title.search(pattern);
    if (index >= 0 && index < earliest) {
      earliest = index;
      match = kind;
    }
  }

  return match;
}

export function formatTodayLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CALENDAR_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatSyncedClock(isoDate: string) {
  return formatClock(isoDate);
}
