import React, { useEffect, useId, useRef, useState } from "react";
import {
  displayTitle,
  eventKind,
  eventStatus,
  formatEventClocks,
  parseTodaysEvents,
} from "../../lib/today";

const KIND_LABEL = {
  bachata: "Bachata",
  salsa: "Salsa",
  kizomba: "Kizomba",
  zouk: "Zouk",
};

function EventRow({ event, onOpen }) {
  const status = eventStatus(event);
  const clocks = formatEventClocks(event);
  const kind = eventKind(event.title);

  return (
    <li className={status === "past" ? "today-event is-past" : "today-event"}>
      <button type="button" onClick={() => onOpen(event)}>
        <time dateTime={event.start}>
          <span>{clocks.start}</span>
          {clocks.end ? <span>{clocks.end}</span> : null}
        </time>
        <div>
          <p className="today-event-title">
            {displayTitle(event.title)}
            {status === "now" ? <span className="today-now">Now</span> : null}
          </p>
          {event.phases.length > 0 ? (
            <p className="today-event-phases">
              {event.phases.map((phase, index) => (
                <span key={`${phase.label}-${phase.time}`}>
                  {index > 0 ? " · " : ""}
                  {phase.label} {phase.time}
                </span>
              ))}
            </p>
          ) : null}
          <p className="today-event-meta">
            {event.location ? <span>{event.location}</span> : null}
            {event.priceLabel ? (
              <span className="today-price">{event.priceLabel}</span>
            ) : null}
            {kind ? <span className={`today-kind today-kind-${kind}`}>{KIND_LABEL[kind]}</span> : null}
            {event.isRecurring ? <span>Weekly</span> : null}
          </p>
        </div>
      </button>
    </li>
  );
}

function EventGroup({ title, events, onOpen }) {
  if (events.length === 0) {
    return null;
  }

  return (
    <li>
      <h3>{title}</h3>
      <ul>
        {events.map((event) => (
          <EventRow key={event.id} event={event} onOpen={onOpen} />
        ))}
      </ul>
    </li>
  );
}

function TodaySection() {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState("loading");
  const [active, setActive] = useState(null);

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
          setPayload(parseTodaysEvents(ics));
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

  const grouped = { now: [], upcoming: [], past: [] };
  if (payload) {
    for (const event of payload.events) {
      grouped[eventStatus(event)].push(event);
    }
  }

  const clocks = active ? formatEventClocks(active) : null;
  const kind = active ? eventKind(active.title) : null;

  return (
    <section className="today-part" id="today">
      <div className="title text-center">
        <p>{payload ? payload.label : "Stockholm time"}</p>
        <h1>Today on the floor</h1>
      </div>
      <div className="container">
        {status === "loading" ? (
          <p className="today-status">Loading today’s events…</p>
        ) : null}
        {status === "error" ? (
          <p className="today-status">
            Could not load today’s events. Check the week view below.
          </p>
        ) : null}
        {status === "ready" && payload.events.length === 0 ? (
          <p className="today-status">
            Quiet floor tonight. Check the week view, or subscribe so the next
            social doesn’t sneak by.
          </p>
        ) : null}
        {status === "ready" && payload.events.length > 0 ? (
          <ul className="today-groups">
            <EventGroup title="Happening now" events={grouped.now} onOpen={setActive} />
            <EventGroup title="Coming up" events={grouped.upcoming} onOpen={setActive} />
            <EventGroup title="Earlier today" events={grouped.past} onOpen={setActive} />
          </ul>
        ) : null}
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
                <time dateTime={active.start}>
                  {clocks.end ? `${clocks.start}–${clocks.end}` : clocks.start}
                </time>
                {kind ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>{KIND_LABEL[kind]}</span>
                  </>
                ) : null}
              </p>
              <h3 id={titleId}>{displayTitle(active.title)}</h3>
            </div>
            <div className="highlight-dialog-body">
              {active.location ? <p className="highlight-venue">{active.location}</p> : null}
              {active.priceLabel ? <p className="today-price">{active.priceLabel}</p> : null}
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

export default TodaySection;
