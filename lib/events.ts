import ical, { type CalendarComponent, type ParameterValue, type VEvent } from "node-ical";
import { unstable_cache } from "next/cache";
import {
  cleanEventDescription,
  parseEventPhases,
  parseEventPrice,
  parseSourceUrl,
} from "@/lib/event-details";
import {
  formatTodayLabel,
  stockholmDateKey,
  type TodayEvent,
  type TodayPayload,
} from "@/lib/event-display";
import {
  cleanHighlightTitle,
  detectHighlightKind,
  highlightBlurb,
  inclusiveEndDateKey,
  isHighlightCandidate,
  upcomingHighlights,
  type Highlight,
} from "@/lib/highlights";
import { CALENDAR_ICAL_URL, CALENDAR_SYNC_SECONDS, CALENDAR_TIMEZONE } from "@/lib/site";

const ICS_REVALIDATE_SECONDS = CALENDAR_SYNC_SECONDS;
const HIGHLIGHT_HORIZON_MONTHS = 18;

function textValue(value: ParameterValue | undefined): string {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value.val;
}

function getOffsetMs(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - date.getTime();
}

function zonedLocalToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = getOffsetMs(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offset);
}

function calendarParts(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function shortLocation(value: string) {
  const firstPart = value.split(",")[0]?.trim() ?? "";
  return firstPart.replace(/\s+/g, " ");
}

function isVEvent(item: CalendarComponent | undefined): item is VEvent {
  return item?.type === "VEVENT";
}

async function fetchCalendarFeed() {
  const response = await fetch(CALENDAR_ICAL_URL, {
    cache: "no-store",
    headers: { "User-Agent": "StockholmBachataCalendar/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Calendar feed failed: ${response.status}`);
  }

  return {
    ics: await response.text(),
    fetchedAt: new Date().toISOString(),
  };
}

/** Short-lived cache for the Today API — not used for homepage highlights. */
export const getCachedCalendarFeed = unstable_cache(
  fetchCalendarFeed,
  ["calendar-ics", CALENDAR_ICAL_URL],
  { revalidate: ICS_REVALIDATE_SECONDS, tags: ["calendar-ics"] },
);

export function parseTodaysEvents(ics: string, now = new Date()): Omit<TodayPayload, "fetchedAt"> {
  const { year, month, day } = calendarParts(now, CALENDAR_TIMEZONE);
  const from = zonedLocalToUtc(CALENDAR_TIMEZONE, year, month, day);
  const to = zonedLocalToUtc(CALENDAR_TIMEZONE, year, month, day, 23, 59, 59);
  const calendar = ical.parseICS(ics);
  const seen = new Set<string>();
  const events: TodayEvent[] = [];

  for (const item of Object.values(calendar)) {
    if (!isVEvent(item) || item.status === "CANCELLED") {
      continue;
    }

    if (item.recurrenceid && !item.rrule) {
      continue;
    }

    for (const instance of ical.expandRecurringEvent(item, {
      from,
      to,
      expandOngoing: true,
    })) {
      const id = `${item.uid}-${instance.start.getTime()}`;
      if (seen.has(id)) {
        continue;
      }

      seen.add(id);
      const description = textValue(instance.event.description);
      events.push({
        id,
        title: textValue(instance.summary).trim(),
        location: shortLocation(textValue(instance.event.location)),
        start: instance.start.toISOString(),
        end: instance.end.toISOString(),
        isAllDay: instance.isFullDay,
        isRecurring: instance.isRecurring,
        priceLabel: parseEventPrice(description),
        phases: parseEventPhases(description),
        sourceUrl: parseSourceUrl(description),
      });
    }
  }

  return {
    events: events
      .filter((event) => event.title)
      .sort((a, b) => a.start.localeCompare(b.start)),
    label: formatTodayLabel(now),
    dateKey: stockholmDateKey(now),
  };
}

export async function getTodaysPayload(): Promise<TodayPayload> {
  const { ics, fetchedAt } = await getCachedCalendarFeed();
  return {
    ...parseTodaysEvents(ics),
    fetchedAt,
  };
}

function addMonths(date: Date, months: number) {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function rruleText(event: VEvent) {
  const rule = event.rrule;
  if (!rule) {
    return "";
  }

  if (typeof rule === "string") {
    return rule;
  }

  if (typeof rule.toString === "function") {
    return rule.toString();
  }

  return "";
}

export function parseHighlights(ics: string, now = new Date()): Highlight[] {
  const from = now;
  const to = addMonths(now, HIGHLIGHT_HORIZON_MONTHS);
  const calendar = ical.parseICS(ics);
  const seen = new Set<string>();
  const highlights: Highlight[] = [];

  for (const item of Object.values(calendar)) {
    if (!isVEvent(item) || item.status === "CANCELLED") {
      continue;
    }

    if (item.recurrenceid && !item.rrule) {
      continue;
    }

    const rule = rruleText(item);

    for (const instance of ical.expandRecurringEvent(item, {
      from,
      to,
      expandOngoing: true,
    })) {
      const title = textValue(instance.summary).trim();
      if (
        !isHighlightCandidate({
          title,
          start: instance.start,
          end: instance.end,
          rrule: rule,
        })
      ) {
        continue;
      }

      const id = `${item.uid}-${instance.start.getTime()}`;
      if (seen.has(id)) {
        continue;
      }

      seen.add(id);
      const rawDescription = textValue(instance.event.description);
      const description = cleanEventDescription(rawDescription);
      const startDate = stockholmDateKey(instance.start);
      const endDate = inclusiveEndDateKey(instance.start, instance.end);

      highlights.push({
        id,
        title: cleanHighlightTitle(title),
        kind: detectHighlightKind(title),
        startDate,
        endDate,
        venue: shortLocation(textValue(instance.event.location)),
        blurb: highlightBlurb(description),
        description,
        sourceUrl: parseSourceUrl(rawDescription),
      });
    }
  }

  return upcomingHighlights(stockholmDateKey(now), highlights);
}

export async function getHighlights(): Promise<Highlight[]> {
  // Always hit the live ICS so a browser refresh picks up new weekends/cruises.
  const { ics } = await fetchCalendarFeed();
  return parseHighlights(ics);
}
