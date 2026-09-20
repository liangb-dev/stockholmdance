"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import {
  eventKind,
  eventStatus,
  formatEventClocks,
  type DanceKind,
  type TodayEvent,
  type TodayEventStatus,
} from "@/lib/event-display";

const KIND_LABEL: Record<DanceKind, string> = {
  bachata: "Bachata",
  salsa: "Salsa",
  kizomba: "Kizomba",
  zouk: "Zouk",
};

const KIND_CLASS: Record<DanceKind, string> = {
  bachata: "text-kind-bachata bg-kind-bachata/10",
  salsa: "text-kind-salsa bg-kind-salsa/10",
  kizomba: "text-kind-kizomba bg-kind-kizomba/10",
  zouk: "text-kind-zouk bg-kind-zouk/10",
};

const KIND_BAR: Record<DanceKind, string> = {
  bachata: "bg-kind-bachata",
  salsa: "bg-kind-salsa",
  kizomba: "bg-kind-kizomba",
  zouk: "bg-kind-zouk",
};

function EventRow({
  event,
  onOpen,
}: {
  event: TodayEvent;
  onOpen: (event: TodayEvent) => void;
}) {
  const status = eventStatus(event);
  const clocks = formatEventClocks(event);
  const kind = eventKind(event.title);

  return (
    <li className={status === "past" ? "opacity-50" : undefined}>
      <button
        type="button"
        onClick={() => onOpen(event)}
        className="group relative flex w-full gap-3 py-4 pl-3 text-left transition-colors hover:bg-accent-wash/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span
          className={`absolute top-4 bottom-4 left-0 w-[3px] rounded-full ${
            status === "now"
              ? "bg-accent"
              : kind
                ? KIND_BAR[kind]
                : "bg-border"
          }`}
        />
        <time
          className="w-[3.15rem] shrink-0 pt-0.5 tabular-nums"
          dateTime={event.start}
        >
          <span className="block text-[0.95rem] font-semibold leading-tight">
            {clocks.start}
          </span>
          {clocks.end ? (
            <span className="mt-0.5 block text-[0.75rem] leading-tight text-muted">
              {clocks.end}
            </span>
          ) : null}
        </time>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 text-[0.98rem] leading-snug font-medium break-words transition-colors group-hover:text-accent">
              {event.title}
            </p>
            {status === "now" ? (
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-wash px-2 py-0.5 text-[0.68rem] font-bold tracking-wide text-accent uppercase">
                <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                Now
              </span>
            ) : null}
          </div>

          {event.phases.length > 0 ? (
            <p className="mt-1.5 text-[0.82rem] leading-snug text-muted">
              {event.phases.map((phase, index) => (
                <span key={`${phase.label}-${phase.time}`}>
                  {index > 0 ? <span className="text-border"> · </span> : null}
                  <span className="font-medium text-foreground/80">
                    {phase.label}
                  </span>
                  <span> {phase.time}</span>
                </span>
              ))}
            </p>
          ) : null}

          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.85rem] break-words text-muted">
            {event.location ? <span>{event.location}</span> : null}
            {event.priceLabel ? (
              <span className="font-medium text-gold">{event.priceLabel}</span>
            ) : null}
            {kind ? (
              <span
                className={`rounded-full px-1.5 py-px text-[0.68rem] font-semibold tracking-wide uppercase ${KIND_CLASS[kind]}`}
              >
                {KIND_LABEL[kind]}
              </span>
            ) : null}
            {event.isRecurring ? <span>Weekly</span> : null}
          </p>
        </div>
      </button>
    </li>
  );
}

function EventDetailModal({
  event,
  dialogRef,
  titleId,
  onClose,
}: {
  event: TodayEvent | null;
  dialogRef: RefObject<HTMLDialogElement | null>;
  titleId: string;
  onClose: () => void;
}) {
  if (!event) {
    return (
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-0 m-auto max-h-[min(88vh,40rem)] w-[min(92vw,34rem)] open:flex open:flex-col overflow-hidden rounded-2xl border border-border bg-surface p-0 text-foreground shadow-[0_28px_80px_-28px_rgba(28,20,16,0.55)] backdrop:bg-foreground/45 backdrop:backdrop-blur-[2px]"
        onClose={onClose}
      />
    );
  }

  const status = eventStatus(event);
  const clocks = formatEventClocks(event);
  const kind = eventKind(event.title);
  const timeLabel = clocks.end
    ? `${clocks.start}–${clocks.end}`
    : clocks.start;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto max-h-[min(88vh,40rem)] w-[min(92vw,34rem)] open:flex open:flex-col overflow-hidden rounded-2xl border border-border bg-surface p-0 text-foreground shadow-[0_28px_80px_-28px_rgba(28,20,16,0.55)] backdrop:bg-foreground/45 backdrop:backdrop-blur-[2px]"
      onClose={onClose}
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) {
          clickEvent.currentTarget.close();
        }
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <p className="text-[0.72rem] font-semibold tracking-[0.12em] text-gold uppercase">
              <time dateTime={event.start}>{timeLabel}</time>
              {kind ? (
                <>
                  <span className="mx-1.5 text-border" aria-hidden>
                    ·
                  </span>
                  {KIND_LABEL[kind]}
                </>
              ) : null}
              {event.isRecurring ? (
                <>
                  <span className="mx-1.5 text-border" aria-hidden>
                    ·
                  </span>
                  Weekly
                </>
              ) : null}
            </p>
            {status === "now" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-wash px-2 py-0.5 text-[0.68rem] font-bold tracking-wide text-accent uppercase">
                <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                Now
              </span>
            ) : null}
          </div>
          <h3
            id={titleId}
            className="font-display mt-1.5 text-[1.55rem] leading-tight tracking-tight text-balance"
          >
            {event.title}
          </h3>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:border-accent/30 hover:text-accent"
          onClick={() => dialogRef.current?.close()}
        >
          Close
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {(event.location || event.priceLabel || event.phases.length > 0) && (
          <div className="space-y-2 text-[0.92rem] text-muted">
            {event.location ? <p>{event.location}</p> : null}
            {event.priceLabel ? (
              <p className="font-medium text-gold">{event.priceLabel}</p>
            ) : null}
            {event.phases.length > 0 ? (
              <p>
                {event.phases.map((phase, index) => (
                  <span key={`${phase.label}-${phase.time}`}>
                    {index > 0 ? <span className="text-border"> · </span> : null}
                    <span className="font-medium text-foreground/80">
                      {phase.label}
                    </span>
                    <span> {phase.time}</span>
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        )}

        {event.description ? (
          <p className="mt-4 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-foreground/90">
            {event.description}
          </p>
        ) : (
          <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
            No extra details in the calendar entry yet.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4 sm:px-6">
        {event.sourceUrl ? (
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="btn"
          >
            Open source link
          </a>
        ) : null}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => dialogRef.current?.close()}
        >
          Close
        </button>
      </div>
    </dialog>
  );
}

function EventGroup({
  title,
  events,
  onOpen,
}: {
  title: string;
  events: TodayEvent[];
  onOpen: (event: TodayEvent) => void;
}) {
  if (events.length === 0) {
    return null;
  }

  return (
    <li className="[&:first-child>h3]:pt-2">
      <h3 className="pt-5 pb-1 text-[0.72rem] font-semibold tracking-[0.14em] text-gold uppercase">
        {title}
      </h3>
      <ul className="divide-y divide-border/80">
        {events.map((event) => (
          <EventRow key={event.id} event={event} onOpen={onOpen} />
        ))}
      </ul>
    </li>
  );
}

export function TodayEventList({ events }: { events: TodayEvent[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [active, setActive] = useState<TodayEvent | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (active) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [active]);

  if (events.length === 0) {
    return (
      <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
        Quiet floor tonight. Check the week view, or add the calendar so the
        next social doesn’t sneak by.
      </p>
    );
  }

  const grouped: Record<TodayEventStatus, TodayEvent[]> = {
    now: [],
    upcoming: [],
    past: [],
  };

  for (const event of events) {
    grouped[eventStatus(event)].push(event);
  }

  return (
    <>
      <ul className="mt-1">
        <EventGroup title="Happening now" events={grouped.now} onOpen={setActive} />
        <EventGroup title="Coming up" events={grouped.upcoming} onOpen={setActive} />
        <EventGroup title="Earlier today" events={grouped.past} onOpen={setActive} />
      </ul>

      <EventDetailModal
        event={active}
        dialogRef={dialogRef}
        titleId={titleId}
        onClose={() => setActive(null)}
      />
    </>
  );
}
