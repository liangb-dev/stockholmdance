import React, { useEffect, useId, useRef, useState } from "react";
import {
  formatHighlightDates,
  highlightKindLabel,
  isHighlightOngoing,
  parseHighlights,
  parseOpenHouses,
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

function CategorySection({ id, className, kicker, title, intro, status, items, todayKey, onOpen }) {
  if (status === "ready" && items.length === 0) {
    return null;
  }

  return (
    <section className={className} id={id}>
      <div className="title text-center">
        <p>{kicker}</p>
        <h1>{title}</h1>
      </div>
      <p className="highlights-intro">{intro}</p>
      <div className="container">
        {status === "loading" ? (
          <p className="highlights-status">Loading…</p>
        ) : (
          <ul className="highlights-grid">
            {items.map((highlight) => (
              <HighlightCard
                key={highlight.id}
                highlight={highlight}
                ongoing={isHighlightOngoing(highlight, todayKey)}
                onOpen={onOpen}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function HighlightsSection({ onOpenHouseChange }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [openHouses, setOpenHouses] = useState([]);
  const [festivals, setFestivals] = useState([]);
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
          const houses = parseOpenHouses(ics);
          setOpenHouses(houses);
          setFestivals(parseHighlights(ics));
          setStatus("ready");
          onOpenHouseChange?.(houses.length > 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          onOpenHouseChange?.(false);
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

  if (
    status === "error" ||
    (status === "ready" && openHouses.length === 0 && festivals.length === 0)
  ) {
    return null;
  }

  const activeOngoing = active ? isHighlightOngoing(active, todayKey) : false;

  return (
    <>
      {openHouses.length > 0 ? (
        <CategorySection
          id="open-house"
          className="highlights-part open-house-part"
          kicker="free to try"
          title="Open house"
          intro="Drop in and try a class — öppet hus from the calendar."
          status="ready"
          items={openHouses}
          todayKey={todayKey}
          onOpen={setActive}
        />
      ) : null}
      <CategorySection
        id="highlights"
        className="highlights-part"
        kicker="upcoming and ongoing"
        title="Weekends & festivals"
        intro="From the calendar — festivals, weekends, and cruises."
        status={status}
        items={festivals}
        todayKey={todayKey}
        onOpen={setActive}
      />

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
    </>
  );
}

export default HighlightsSection;
