import { stockholmDateKey } from "@/lib/event-display";

export type HighlightKind = "cruise" | "festival" | "weekend";

export type Highlight = {
  id: string;
  title: string;
  kind: HighlightKind;
  /** Inclusive start date, Stockholm calendar day (YYYY-MM-DD). */
  startDate: string;
  /** Inclusive end date, Stockholm calendar day (YYYY-MM-DD). */
  endDate: string;
  venue: string;
  blurb: string;
  /** Full calendar description for the details modal. */
  description: string;
  /** Optional ticket/info URL extracted from the calendar entry. */
  sourceUrl: string;
};

const KIND_LABEL: Record<HighlightKind, string> = {
  cruise: "Cruise",
  festival: "Festival",
  weekend: "Weekend",
};

/** Title cues that mark a highlight (not a regular social). */
const HIGHLIGHT_TITLE =
  /\b(festival|weekend|cruise|kryssning|congress|bootcamp|intensive)\b/i;

const WEEKLY_RULE = /FREQ=WEEKLY/i;

export function highlightKindLabel(kind: HighlightKind) {
  return KIND_LABEL[kind];
}

export function detectHighlightKind(title: string): HighlightKind {
  if (/\b(cruise|kryssning)\b/i.test(title)) {
    return "cruise";
  }

  if (/\bweekend\b/i.test(title)) {
    return "weekend";
  }

  return "festival";
}

export function cleanHighlightTitle(title: string) {
  return title
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Component}\s]+/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function highlightBlurb(description: string, maxLength = 140) {
  const plain = description
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) {
    return "";
  }

  if (plain.length <= maxLength) {
    return plain;
  }

  const slice = plain.slice(0, maxLength - 1);
  const cut = slice.lastIndexOf(" ");
  return `${(cut > 60 ? slice.slice(0, cut) : slice).trim()}…`;
}

/**
 * Heuristic: keyword in the title, or a true multi-day span
 * (avoids one-night parties that cross midnight).
 */
export function isHighlightCandidate(input: {
  title: string;
  start: Date;
  end: Date;
  rrule?: string;
}) {
  if (input.rrule && WEEKLY_RULE.test(input.rrule)) {
    return false;
  }

  const title = cleanHighlightTitle(input.title);
  if (!title) {
    return false;
  }

  if (HIGHLIGHT_TITLE.test(title)) {
    return true;
  }

  const startKey = stockholmDateKey(input.start);
  const endKey = inclusiveEndDateKey(input.start, input.end);
  const daySpan = daySpanInclusive(startKey, endKey);
  const durationHours =
    (input.end.getTime() - input.start.getTime()) / (1000 * 60 * 60);

  if (daySpan >= 3) {
    return true;
  }

  return daySpan >= 2 && durationHours >= 20;
}

export function inclusiveEndDateKey(start: Date, end: Date) {
  const startKey = stockholmDateKey(start);
  let endKey = stockholmDateKey(end);

  // Timed events often end after midnight; keep that morning on the end day.
  // All-day ICS ends are exclusive — if end is midnight-ish and same stamp
  // math collapses, step back one Stockholm day when end <= start day.
  if (endKey < startKey) {
    return startKey;
  }

  // Exclusive all-day end (00:00 next day): if duration is N midnights and
  // clock is early, treat previous calendar day as last inclusive day.
  const endHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Stockholm",
      hour: "numeric",
      hourCycle: "h23",
    }).format(end),
  );
  const endMinute = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Stockholm",
      minute: "numeric",
    }).format(end),
  );

  if (endKey > startKey && endHour === 0 && endMinute === 0) {
    endKey = shiftDateKey(endKey, -1);
  }

  return endKey < startKey ? startKey : endKey;
}

function daySpanInclusive(startKey: string, endKey: string) {
  const start = Date.parse(`${startKey}T12:00:00Z`);
  const end = Date.parse(`${endKey}T12:00:00Z`);
  return Math.floor((end - start) / 86_400_000) + 1;
}

function shiftDateKey(dateKey: string, deltaDays: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}

export function formatHighlightDates(highlight: Highlight) {
  const start = parseDateOnly(highlight.startDate);
  const end = parseDateOnly(highlight.endDate);

  if (highlight.startDate === highlight.endDate) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(start);
  }

  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    const monthYear = new Intl.DateTimeFormat("en-GB", {
      month: "short",
      year: "numeric",
    }).format(start);
    return `${start.getUTCDate()}–${end.getUTCDate()} ${monthYear}`;
  }

  const startLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(end);

  return `${startLabel} – ${endLabel}`;
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

/** Still on the calendar: upcoming or currently happening. */
export function upcomingHighlights(todayKey: string, items: Highlight[]) {
  return items
    .filter((item) => item.endDate >= todayKey)
    .sort((a, b) => {
      const aOngoing = isHighlightOngoing(a, todayKey) ? 0 : 1;
      const bOngoing = isHighlightOngoing(b, todayKey) ? 0 : 1;
      if (aOngoing !== bOngoing) {
        return aOngoing - bOngoing;
      }

      return (
        a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title)
      );
    });
}

export function isHighlightOngoing(highlight: Highlight, todayKey: string) {
  return highlight.startDate <= todayKey && highlight.endDate >= todayKey;
}
