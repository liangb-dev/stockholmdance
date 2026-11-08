import { useEffect, useSyncExternalStore } from "react";
import { interpretCalendarFeed, isCompleteCalendar } from "./calendar-feed";

const serverSnapshot = {
  status: "loading",
  body: "",
  reason: "loading",
  refreshing: false,
};

let snapshot = serverSnapshot;
const listeners = new Set();
let started = false;
let requestSeq = 0;

function emit(next) {
  snapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

async function loadCalendarFeed({ refresh }) {
  const requestId = ++requestSeq;
  const previousBody = isCompleteCalendar(snapshot.body) ? snapshot.body : "";

  if (!previousBody) {
    emit({ status: "loading", body: "", reason: "loading", refreshing: false });
  } else {
    emit({ ...snapshot, refreshing: true });
  }

  const url = refresh ? `/api/calendar.ics?refresh=${Date.now()}` : "/api/calendar.ics";

  try {
    const response = await fetch(url, { cache: "no-store" });
    const body = await response.text();
    if (requestId !== requestSeq) {
      return null;
    }
    const next = interpretCalendarFeed({
      ok: response.ok,
      body,
      age: response.headers.get("age"),
      date: response.headers.get("date"),
      fetchedAt: response.headers.get("x-calendar-fetched-at"),
      previousBody,
    });
    emit({ ...next, refreshing: false });
  } catch {
    if (requestId !== requestSeq) {
      return null;
    }
    const next = interpretCalendarFeed({
      ok: false,
      body: "",
      previousBody,
    });
    emit({ ...next, refreshing: false });
  }

  return snapshot;
}

function ensureLoaded() {
  if (!started) {
    started = true;
    loadCalendarFeed({ refresh: false });
  }
}

export function retryCalendarFeed() {
  return loadCalendarFeed({ refresh: true });
}

export function useCalendarFeed() {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);

  useEffect(() => {
    ensureLoaded();
  }, []);

  return { ...current, retry: retryCalendarFeed };
}
