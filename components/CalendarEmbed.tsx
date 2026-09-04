"use client";

import { useEffect, useState } from "react";
import { CALENDAR_EMBED_URL, SITE_NAME } from "@/lib/site";

const LOAD_FALLBACK_MS = 12000;

export function CalendarEmbed() {
  const [src, setSrc] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSrc(CALENDAR_EMBED_URL);
    const timeout = window.setTimeout(() => setReady(true), LOAD_FALLBACK_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <section
      id="week"
      className="lg:sticky lg:top-8"
      aria-labelledby="week-heading"
    >
      <div className="mb-3">
        <h2
          id="week-heading"
          className="font-display text-[1.65rem] leading-none tracking-tight"
        >
          This week
        </h2>
        <p className="mt-1 text-sm text-muted">Stockholm time · week starts Monday</p>
      </div>
      <div
        className="relative isolate overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_18px_50px_-28px_rgba(28,20,16,0.45)]"
        aria-busy={!ready}
      >
        {src ? (
          <iframe
            title={`${SITE_NAME} calendar`}
            src={src}
            className={`relative z-0 h-[min(72vh,820px)] min-h-[420px] w-full border-0 sm:min-h-[560px] ${
              ready ? "visible" : "invisible"
            }`}
            onLoad={() => setReady(true)}
          />
        ) : (
          <div className="h-[min(72vh,820px)] min-h-[420px] w-full sm:min-h-[560px]" />
        )}
        <div
          className={`absolute inset-0 z-10 flex flex-col items-center justify-start gap-3 bg-surface pt-16 transition-opacity duration-300 sm:pt-24 ${
            ready ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          aria-hidden={ready}
        >
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent"
            aria-hidden
          />
          <p className="text-[0.95rem] text-muted" role="status">
            Loading calendar…
          </p>
        </div>
      </div>
    </section>
  );
}
