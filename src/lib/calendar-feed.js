// Fresh lifetime of /api/calendar.ics. Older copies stay usable, but are not shown as a new load.
export const CALENDAR_FRESH_SECONDS = 300;
export const CALENDAR_REVALIDATE_SECONDS = 600;
export const CALENDAR_FAILURE_BODY = "Calendar feed failed";

const MAX_FEED_CHARS = 5_000_000;

export function isCompleteCalendar(text) {
  if (typeof text !== "string" || text.length === 0 || text.length > MAX_FEED_CHARS) {
    return false;
  }

  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed.startsWith("BEGIN:VCALENDAR")) {
    return false;
  }

  const endAt = trimmed.lastIndexOf("END:VCALENDAR");
  if (endAt <= 0) {
    return false;
  }

  return trimmed.slice(endAt + "END:VCALENDAR".length).trim().length === 0;
}

function timestampAgeSeconds(value, now) {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.max(0, (now - parsed) / 1000);
}

export function calendarAgeSeconds({ age, date, fetchedAt, now = Date.now() } = {}) {
  const samples = [];

  if (age != null && String(age).trim() !== "") {
    const parsed = Number(String(age).trim());
    if (Number.isFinite(parsed) && parsed >= 0) {
      samples.push(parsed);
    }
  }

  for (const value of [fetchedAt, date]) {
    const seconds = timestampAgeSeconds(value, now);
    if (seconds != null) {
      samples.push(seconds);
    }
  }

  if (samples.length === 0) {
    return null;
  }

  return Math.max(...samples);
}

export function interpretCalendarFeed({
  ok = false,
  body = "",
  age,
  date,
  fetchedAt,
  previousBody = "",
  now,
  freshSeconds = CALENDAR_FRESH_SECONDS,
} = {}) {
  const previous = isCompleteCalendar(previousBody) ? previousBody : "";

  if (!(ok && isCompleteCalendar(body))) {
    if (previous) {
      return { status: "stale", body: previous, reason: "unavailable" };
    }
    return { status: "error", body: "", reason: "unavailable" };
  }

  const ageSeconds = calendarAgeSeconds({ age, date, fetchedAt, now });
  if (ageSeconds != null && ageSeconds >= freshSeconds) {
    return { status: "stale", body, reason: "aged" };
  }

  return { status: "ready", body, reason: "fresh" };
}

export function weekPresentation(status) {
  if (status === "loading") {
    return { notice: "loading", days: false };
  }
  if (status === "stale") {
    return { notice: "stale", days: true };
  }
  if (status === "ready") {
    return { notice: null, days: true };
  }
  return { notice: "error", days: false };
}

export function todayPresentation(status, eventCount) {
  const week = weekPresentation(status);
  return {
    notice: week.notice,
    events: week.days && eventCount > 0,
    empty: week.days && eventCount === 0,
  };
}

export function highlightsPresentation(status, itemCount) {
  if (status === "loading") {
    return { notice: "loading", items: false, hidden: false };
  }
  if (status === "error") {
    return { notice: "error", items: false, hidden: false };
  }
  if (status === "stale") {
    return { notice: "stale", items: itemCount > 0, hidden: false };
  }
  if (status === "ready") {
    return { notice: null, items: itemCount > 0, hidden: itemCount === 0 };
  }
  return { notice: "error", items: false, hidden: false };
}

export function isRefreshRequest(url) {
  try {
    return new URL(url || "/", "http://localhost").searchParams.has("refresh");
  } catch {
    return false;
  }
}

export function calendarProxyResult({
  upstreamOk = false,
  upstreamBody = "",
  refresh = false,
  fetchedAt = new Date().toISOString(),
} = {}) {
  if (!(upstreamOk && isCompleteCalendar(upstreamBody))) {
    return {
      status: 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
      body: CALENDAR_FAILURE_BODY,
    };
  }

  return {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": refresh
        ? "no-store"
        : `s-maxage=${CALENDAR_FRESH_SECONDS}, stale-while-revalidate=${CALENDAR_REVALIDATE_SECONDS}`,
      "X-Calendar-Fetched-At": fetchedAt,
    },
    body: upstreamBody,
  };
}
