"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TodayEventList } from "@/components/TodayEventList";
import {
  formatSyncedAt,
  stockholmDateKey,
  type TodayPayload,
} from "@/lib/event-display";
import { CALENDAR_SYNC_SECONDS } from "@/lib/site";

const CACHE_KEY = "today-summary-v1";
const DURATION_KEY = "today-fetch-duration-ms";
const DEFAULT_DURATION_MS = 4000;
const STALE_MS = CALENDAR_SYNC_SECONDS * 1000;
const OVERLAY_DELAY_MS = 400;

type CachedToday = {
  payload: TodayPayload;
  checkedAt: number;
};

function readExpectedDuration() {
  if (typeof window === "undefined") {
    return DEFAULT_DURATION_MS;
  }

  const stored = Number(window.localStorage.getItem(DURATION_KEY));
  if (!Number.isFinite(stored) || stored <= 0) {
    return DEFAULT_DURATION_MS;
  }

  return Math.min(15000, Math.max(1500, stored));
}

function rememberDuration(durationMs: number) {
  const previous = readExpectedDuration();
  const next = Math.round(previous * 0.6 + durationMs * 0.4);
  window.localStorage.setItem(
    DURATION_KEY,
    String(Math.min(15000, Math.max(1500, next))),
  );
}

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

function LoadingCountdown({ expectedMs }: { expectedMs: number }) {
  const [remaining, setRemaining] = useState(Math.ceil(expectedMs / 1000));

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const left = expectedMs - (Date.now() - startedAt);
      setRemaining(Math.max(0, Math.ceil(left / 1000)));
    }, 250);

    return () => window.clearInterval(timer);
  }, [expectedMs]);

  return (
    <p className="mt-3 text-[0.95rem] text-muted" aria-live="polite">
      {remaining > 0
        ? `Loading today's events… about ${remaining}s remaining.`
        : "Still loading today's events…"}
    </p>
  );
}

export function TodaySummary() {
  const [payload, setPayload] = useState<TodayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");
  const [expectedMs, setExpectedMs] = useState(DEFAULT_DURATION_MS);
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
    const startedAt = Date.now();
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
      rememberDuration(Date.now() - startedAt);
      writeCachedToday(nextPayload);
      setPayload(nextPayload);
    } catch {
      if (options.background && cached) {
        setError("Could not refresh events. Showing the last loaded list.");
      } else {
        setError("Could not load today's events. Check the calendar below, or try again.");
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
    setExpectedMs(readExpectedDuration());

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

  const showCountdown = hydrated && !payload && loading;

  return (
    <section className="relative mt-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Today</h2>
        {payload ? <p className="text-[0.95rem] text-muted">{payload.label}</p> : null}
      </div>
      {payload ? (
        <p className="mt-1 text-[0.8rem] text-muted">
          Last synced {formatSyncedAt(payload.fetchedAt)}
        </p>
      ) : null}

      {checking ? (
        <p
          className="mt-3 rounded-md bg-accent-wash px-3 py-2 text-[0.9rem] text-foreground"
          aria-live="polite"
        >
          Checking for new events…
        </p>
      ) : null}

      {!hydrated && !payload ? (
        <p className="mt-3 text-[0.95rem] text-muted">Loading today's events…</p>
      ) : null}

      {showCountdown ? <LoadingCountdown expectedMs={expectedMs} /> : null}

      {error && !payload ? (
        <div className="mt-3">
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
