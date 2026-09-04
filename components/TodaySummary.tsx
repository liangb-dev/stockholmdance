"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TodayEventList } from "@/components/TodayEventList";
import {
  formatSyncedClock,
  stockholmDateKey,
  type TodayPayload,
} from "@/lib/event-display";
import { CALENDAR_SYNC_SECONDS } from "@/lib/site";

const CACHE_KEY = "today-summary-v1";
const STALE_MS = CALENDAR_SYNC_SECONDS * 1000;
const OVERLAY_DELAY_MS = 400;

type CachedToday = {
  payload: TodayPayload;
  checkedAt: number;
};

function readCachedToday(): CachedToday | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw) as CachedToday;
    if (!cached.payload || cached.payload.dateKey !== stockholmDateKey()) {
      return null;
    }

    return cached;
  } catch {
    return null;
  }
}

function writeCachedToday(payload: TodayPayload) {
  const cached: CachedToday = { payload, checkedAt: Date.now() };
  window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
}

function isFresh(checkedAt: number) {
  return Date.now() - checkedAt < STALE_MS;
}

function EventSkeleton() {
  return (
    <div className="mt-4 space-y-4" aria-hidden>
      {[0.9, 0.7, 0.8, 0.55].map((width, index) => (
        <div key={index} className="flex gap-3">
          <div className="h-9 w-12 animate-pulse rounded bg-border" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div
              className="h-4 animate-pulse rounded bg-border"
              style={{ width: `${width * 100}%` }}
            />
            <div className="h-3 w-1/2 animate-pulse rounded bg-border/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TodaySummary() {
  const [payload, setPayload] = useState<TodayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  const loadEvents = useCallback(async (options: { background: boolean; force?: boolean }) => {
    const cached = readCachedToday();
    if (!options.force && cached && isFresh(cached.checkedAt)) {
      setPayload(cached.payload);
      setLoading(false);
      return;
    }

    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    const overlayTimer = options.background
      ? window.setTimeout(() => setChecking(true), OVERLAY_DELAY_MS)
      : undefined;

    if (!options.background) {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/today", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Request failed");
      }

      const nextPayload = (await response.json()) as TodayPayload;
      writeCachedToday(nextPayload);
      setPayload(nextPayload);
    } catch {
      if (options.background && cached) {
        setError("Could not refresh events. Showing the last loaded list.");
      } else {
        setError("Could not load today's events. Check the week view, or try again.");
      }
    } finally {
      if (overlayTimer) {
        window.clearTimeout(overlayTimer);
      }
      inFlight.current = false;
      setChecking(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = readCachedToday();

    if (cached) {
      setPayload(cached.payload);
      setLoading(false);
    }

    setHydrated(true);
    void loadEvents({ background: Boolean(cached), force: false });

    function onVisible() {
      if (document.visibilityState === "visible") {
        void loadEvents({ background: true, force: false });
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadEvents]);

  const showSkeleton = !payload && (loading || !hydrated);

  return (
    <section id="today" className="relative mt-10">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <div>
          <h2 className="font-display text-[1.65rem] leading-none tracking-tight">
            Today
          </h2>
          {payload ? (
            <p className="mt-1.5 text-sm text-muted">{payload.label}</p>
          ) : null}
        </div>
        <a
          href="#week"
          className="text-sm font-semibold text-accent underline-offset-2 hover:underline lg:hidden"
        >
          Week view
        </a>
      </div>
      {payload ? (
        <p className="mt-1 text-[0.75rem] text-muted">
          Updated {formatSyncedClock(payload.fetchedAt)}
          {payload.events.length > 0
            ? ` · ${payload.events.length} event${payload.events.length === 1 ? "" : "s"}`
            : ""}
        </p>
      ) : null}

      {checking ? (
        <p
          className="mt-3 rounded-full bg-accent-wash px-3 py-1.5 text-[0.82rem] text-foreground"
          aria-live="polite"
        >
          Checking for new events…
        </p>
      ) : null}

      {showSkeleton ? <EventSkeleton /> : null}

      {error && !payload ? (
        <div className="mt-4">
          <p className="text-[0.95rem] text-muted">{error}</p>
          <button
            type="button"
            className="mt-3 text-[0.95rem] font-semibold text-accent"
            onClick={() => void loadEvents({ background: false, force: true })}
          >
            Try again
          </button>
        </div>
      ) : null}

      {error && payload ? (
        <p className="mt-3 text-[0.9rem] text-muted" role="status">
          {error}
        </p>
      ) : null}

      {payload ? <TodayEventList events={payload.events} /> : null}
    </section>
  );
}
