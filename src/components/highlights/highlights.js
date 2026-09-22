import React, { useEffect, useId, useRef, useState } from "react";
import {
  formatHighlightDates,
  highlightKindLabel,
  isHighlightOngoing,
  parseHighlights,
  stockholmDateKey,
} from "../../lib/highlights";

function OngoingPill() {
  return (
    <span className="highlight-ongoing">
      <span className="highlight-ongoing-dot" />
      Ongoing
    </span>
  );
}

function HighlightCard({ highlight, ongoing, onOpen }) {
  return (
    <li>
      <button type="button" className="highlight-card" onClick={() => onOpen(highlight)}>
        <div className="highlight-meta">
          <span>{highlightKindLabel(highlight.kind)}</span>
          <span aria-hidden>·</span>
          <time dateTime={highlight.startDate}>
            {formatHighlightDates(highlight)}
          </time>
          {ongoing ? <OngoingPill /> : null}
        </div>
        <h3>{highlight.title}</h3>
        {highlight.blurb ? <p className="highlight-blurb">{highlight.blurb}</p> : null}
        {highlight.venue ? <p className="highlight-venue">{highlight.venue}</p> : null}
        <p className="highlight-more">
          View details <span aria-hidden>→</span>
        </p>
      </button>
    </li>
  );
}

function HighlightsSection() {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [active, setActive] = useState(null);
  const [todayKey, setTodayKey] = useState(() => stockholmDateKey());

  useEffect(() => {
    setTodayKey(stockholmDateKey());
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/calendar.ics")
      .then((response) => {
        if (!response.ok) {
          throw new Error("feed");
        }
        return response.text();
      })
      .then((ics) => {
        if (!cancelled) {
          setItems(parseHighlights(ics));
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
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

  if (status === "error" || (status === "ready" && items.length === 0)) {
    return null;
  }

  const activeOngoing = active ? isHighlightOngoing(active, todayKey) : false;

  return (
    <section className="highlights-part" id="highlights">
      <div className="title text-center">
        <p>upcoming and ongoing</p>
        <h1>Weekends &amp; festivals</h1>
      </div>
      <p className="highlights-intro">
        From the calendar — festivals, weekends, and cruises.
      </p>
      <div className="container">
        {status === "loading" ? (
          <p className="highlights-status">Loading highlights…</p>
        ) : (
          <ul className="highlights-grid">
            {items.map((highlight) => (
              <HighlightCard
                key={highlight.id}
                highlight={highlight}
                ongoing={isHighlightOngoing(highlight, todayKey)}
                onOpen={setActive}
              />
            ))}
          </ul>
        )}
      </div>

      <dialog
        ref={dialogRef}
        className="highlight-dialog"
        aria-labelledby={titleId}
        onClose={() => setActive(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
      >
        {active ? (
          <>
            <div className="highlight-dialog-head">
              <p className="highlight-meta">
                <span>{highlightKindLabel(active.kind)}</span>
                <span aria-hidden>·</span>
                <time dateTime={active.startDate}>
                  {formatHighlightDates(active)}
                </time>
                {activeOngoing ? <OngoingPill /> : null}
              </p>
              <h3 id={titleId}>{active.title}</h3>
            </div>
            <div className="highlight-dialog-body">
              {active.venue ? <p className="highlight-venue">{active.venue}</p> : null}
              <p className="highlight-description">
                {active.description || "No extra details in the calendar entry yet."}
              </p>
            </div>
            <div className="highlight-dialog-foot">
              {active.sourceUrl ? (
                <a href={active.sourceUrl} target="_blank" rel="noreferrer">
                  Open source link
                </a>
              ) : null}
              <button type="button" onClick={() => dialogRef.current?.close()}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </dialog>
    </section>
  );
}

export default HighlightsSection;
