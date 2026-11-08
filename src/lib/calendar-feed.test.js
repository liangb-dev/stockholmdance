import assert from "node:assert/strict";
import test from "node:test";
import {
  CALENDAR_FAILURE_BODY,
  calendarProxyResult,
  highlightsPresentation,
  interpretCalendarFeed,
  isCompleteCalendar,
  isRefreshRequest,
  todayPresentation,
  weekPresentation,
} from "./calendar-feed.js";

const COMPLETE = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Example//EN
BEGIN:VEVENT
UID:example-1
DTSTART:20261108T180000Z
DTEND:20261108T210000Z
SUMMARY:Example social
LOCATION:Example Hall
END:VEVENT
END:VCALENDAR
`;

const EMPTY = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Example//EN
END:VCALENDAR
`;

const PARTIAL = COMPLETE.replace("END:VCALENDAR", "");
const HTML = "<!doctype html><html><body>feed unavailable</body></html>";
const NOW = Date.parse("2026-11-08T08:33:00Z");

test("a non-calendar response is an error, not an empty schedule", () => {
  assert.equal(isCompleteCalendar(HTML), false);
  assert.equal(isCompleteCalendar(""), false);
  assert.equal(isCompleteCalendar("   "), false);

  const failed = interpretCalendarFeed({ ok: true, body: HTML, now: NOW });
  const today = todayPresentation(failed.status, 0);
  const week = weekPresentation(failed.status);

  assert.equal(failed.status, "error");
  assert.equal(failed.body, "");
  assert.equal(today.notice, "error");
  assert.equal(today.empty, false);
  assert.equal(today.events, false);
  assert.equal(week.days, false);
  assert.equal(highlightsPresentation(failed.status, 0).hidden, false);
});

test("a truncated calendar is not shown as a full load", () => {
  assert.equal(isCompleteCalendar(PARTIAL), false);
  const partial = interpretCalendarFeed({ ok: true, body: PARTIAL, now: NOW });
  assert.equal(partial.status, "error");
  assert.equal(weekPresentation(partial.status).days, false);
  assert.notEqual(partial.body, PARTIAL);
});

test("a complete calendar with no events is a real empty result", () => {
  assert.equal(isCompleteCalendar(EMPTY), true);
  const empty = interpretCalendarFeed({ ok: true, body: EMPTY, age: "12", now: NOW });
  const today = todayPresentation(empty.status, 0);

  assert.equal(empty.status, "ready");
  assert.equal(empty.reason, "fresh");
  assert.equal(today.notice, null);
  assert.equal(today.empty, true);
  assert.equal(weekPresentation(empty.status).days, true);
  assert.equal(highlightsPresentation(empty.status, 0).hidden, true);
});

test("a fresh complete calendar is ready and a cached copy past the fresh lifetime is stale", () => {
  const fresh = interpretCalendarFeed({
    ok: true,
    body: COMPLETE,
    age: "12",
    fetchedAt: "2026-11-08T08:32:00Z",
    now: NOW,
  });
  const stillFresh = interpretCalendarFeed({
    ok: true,
    body: COMPLETE,
    age: "299",
    now: NOW,
  });
  const aged = interpretCalendarFeed({
    ok: true,
    body: COMPLETE,
    age: "300",
    now: NOW,
  });
  const stale = interpretCalendarFeed({
    ok: true,
    body: COMPLETE,
    age: "600",
    date: new Date(NOW).toUTCString(),
    now: NOW,
  });

  assert.equal(fresh.status, "ready");
  assert.equal(weekPresentation(fresh.status).notice, null);
  assert.equal(todayPresentation(fresh.status, 1).events, true);
  assert.equal(stillFresh.status, "ready");
  assert.equal(aged.status, "stale");
  assert.equal(aged.reason, "aged");
  assert.equal(aged.body, COMPLETE);
  assert.equal(stale.status, "stale");
  assert.equal(weekPresentation(stale.status).notice, "stale");
  assert.equal(weekPresentation(stale.status).days, true);
  assert.equal(todayPresentation(stale.status, 1).empty, false);
});

test("an old fetched-at stamp is stale even when the cache age was reset", () => {
  const result = interpretCalendarFeed({
    ok: true,
    body: COMPLETE,
    age: "0",
    fetchedAt: "2026-11-08T08:00:00Z",
    now: NOW,
  });
  assert.equal(result.status, "stale");
  assert.equal(result.reason, "aged");
});

test("a failed refresh keeps the last complete copy and does not present it as new", () => {
  const failed = interpretCalendarFeed({
    ok: false,
    body: HTML,
    previousBody: COMPLETE,
    now: NOW,
  });
  const truncated = interpretCalendarFeed({
    ok: true,
    body: PARTIAL,
    previousBody: COMPLETE,
    now: NOW,
  });

  assert.equal(failed.status, "stale");
  assert.equal(failed.reason, "unavailable");
  assert.equal(failed.body, COMPLETE);
  assert.equal(truncated.body, COMPLETE);
  assert.equal(todayPresentation(failed.status, 1).events, true);
  assert.equal(todayPresentation(failed.status, 1).notice, "stale");
});

test("loading never uses the empty-schedule presentation", () => {
  const today = todayPresentation("loading", 0);
  const week = weekPresentation("loading");
  assert.equal(today.notice, "loading");
  assert.equal(today.empty, false);
  assert.equal(week.days, false);
  assert.equal(highlightsPresentation("loading", 0).hidden, false);
});

test("the proxy does not cache or forward an unusable feed", () => {
  for (const upstreamBody of [HTML, PARTIAL, ""]) {
    const result = calendarProxyResult({
      upstreamOk: true,
      upstreamBody,
      fetchedAt: "2026-11-08T08:33:00.000Z",
    });
    assert.equal(result.status, 502);
    assert.equal(result.body, CALENDAR_FAILURE_BODY);
    assert.equal(result.body.includes("Example"), false);
    assert.equal(result.headers["Cache-Control"], "no-store");
    assert.equal(result.headers["Content-Type"], "text/plain; charset=utf-8");
  }

  const down = calendarProxyResult({ upstreamOk: false, upstreamBody: COMPLETE });
  assert.equal(down.status, 502);
  assert.equal(down.headers["Cache-Control"], "no-store");
});

test("a complete feed is returned with a fresh lifetime, and a refresh is not cached", () => {
  const fetchedAt = "2026-11-08T08:33:00.000Z";
  const result = calendarProxyResult({
    upstreamOk: true,
    upstreamBody: COMPLETE,
    fetchedAt,
  });
  assert.equal(result.status, 200);
  assert.equal(result.body, COMPLETE);
  assert.equal(result.headers["Content-Type"], "text/calendar; charset=utf-8");
  assert.equal(result.headers["Cache-Control"], "s-maxage=300, stale-while-revalidate=600");
  assert.equal(result.headers["X-Calendar-Fetched-At"], fetchedAt);

  const refresh = calendarProxyResult({
    upstreamOk: true,
    upstreamBody: EMPTY,
    refresh: true,
    fetchedAt,
  });
  assert.equal(refresh.status, 200);
  assert.equal(refresh.headers["Cache-Control"], "no-store");
  assert.equal(isRefreshRequest("/api/calendar.ics?refresh=1"), true);
  assert.equal(isRefreshRequest("/api/calendar.ics"), false);
});
