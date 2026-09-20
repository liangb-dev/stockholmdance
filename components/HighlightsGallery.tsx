"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { stockholmDateKey } from "@/lib/event-display";
import {
  formatHighlightDates,
  highlightKindLabel,
  isHighlightOngoing,
  type Highlight,
} from "@/lib/highlights";

function OngoingPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-wash px-2 py-0.5 text-[0.68rem] font-bold tracking-wide text-accent uppercase">
      <span className="size-1.5 animate-pulse rounded-full bg-accent" />
      Ongoing
    </span>
  );
}

function HighlightCard({
  highlight,
  ongoing,
  onOpen,
}: {
  highlight: Highlight;
  ongoing: boolean;
  onOpen: (highlight: Highlight) => void;
}) {
  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={() => onOpen(highlight)}
        className="group flex h-full w-full flex-col rounded-2xl border border-border bg-surface/80 px-5 py-5 text-left transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.72rem] font-semibold tracking-[0.12em] text-gold uppercase">
            <span>{highlightKindLabel(highlight.kind)}</span>
            <span className="text-border" aria-hidden>
              ·
            </span>
            <time dateTime={highlight.startDate}>
              {formatHighlightDates(highlight)}
            </time>
          </div>
          {ongoing ? <OngoingPill /> : null}
        </div>
        <h3 className="font-display mt-2.5 text-[1.35rem] leading-tight tracking-tight text-balance transition-colors group-hover:text-accent">
          {highlight.title}
        </h3>
        {highlight.blurb ? (
          <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{highlight.blurb}</p>
        ) : null}
        {highlight.venue ? (
          <p className="mt-3 text-[0.85rem] text-muted">{highlight.venue}</p>
        ) : null}
        <p className="mt-auto pt-4 text-[0.85rem] font-semibold text-accent">
          View details
          <span
            aria-hidden
            className="ml-1 inline-block transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </p>
      </button>
    </li>
  );
}

function HighlightModal({
  highlight,
  ongoing,
  dialogRef,
  titleId,
  onClose,
}: {
  highlight: Highlight | null;
  ongoing: boolean;
  dialogRef: RefObject<HTMLDialogElement | null>;
  titleId: string;
  onClose: () => void;
}) {
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto max-h-[min(88vh,40rem)] w-[min(92vw,34rem)] open:flex open:flex-col overflow-hidden rounded-2xl border border-border bg-surface p-0 text-foreground shadow-[0_28px_80px_-28px_rgba(28,20,16,0.55)] backdrop:bg-foreground/45 backdrop:backdrop-blur-[2px]"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
    >
      {highlight ? (
        <>
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <p className="text-[0.72rem] font-semibold tracking-[0.12em] text-gold uppercase">
                  {highlightKindLabel(highlight.kind)}
                  <span className="mx-1.5 text-border" aria-hidden>
                    ·
                  </span>
                  <time dateTime={highlight.startDate}>
                    {formatHighlightDates(highlight)}
                  </time>
                </p>
                {ongoing ? <OngoingPill /> : null}
              </div>
              <h3
                id={titleId}
                className="font-display mt-1.5 text-[1.55rem] leading-tight tracking-tight text-balance"
              >
                {highlight.title}
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
            {highlight.venue ? (
              <p className="text-[0.92rem] text-muted">{highlight.venue}</p>
            ) : null}

            {highlight.description ? (
              <p className="mt-4 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-foreground/90">
                {highlight.description}
              </p>
            ) : (
              <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
                No extra details in the calendar entry yet.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4 sm:px-6">
            {highlight.sourceUrl ? (
              <a
                href={highlight.sourceUrl}
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
        </>
      ) : null}
    </dialog>
  );
}

export function HighlightsGallery({ items }: { items: Highlight[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [active, setActive] = useState<Highlight | null>(null);
  const [todayKey, setTodayKey] = useState(() => stockholmDateKey());

  useEffect(() => {
    setTodayKey(stockholmDateKey());
  }, []);

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

  const activeOngoing = active ? isHighlightOngoing(active, todayKey) : false;

  return (
    <>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((highlight) => (
          <HighlightCard
            key={highlight.id}
            highlight={highlight}
            ongoing={isHighlightOngoing(highlight, todayKey)}
            onOpen={setActive}
          />
        ))}
      </ul>

      <HighlightModal
        highlight={active}
        ongoing={activeOngoing}
        dialogRef={dialogRef}
        titleId={titleId}
        onClose={() => setActive(null)}
      />
    </>
  );
}
