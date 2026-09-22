import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  displayTitle,
  eventKind,
  formatEventClocks,
  formatWeekRangeLabel,
  getMondayWeek,
  parseEventsInRange,
  shiftStockholmDays,
} from "../../lib/today";
import { stockholmDateKey } from "../../lib/highlights";
import { CALENDAR_SUBSCRIBE_URL } from "../../site";

const KIND_LABEL = {
  bachata: "Bachata",
  salsa: "Salsa",
  kizomba: "Kizomba",
  zouk: "Zouk",
};

function CalendarSection() {
  const dialogRef = useRef(null);
  const titleId = useId();
  const icsRef = useRef("");
  const [status, setStatus] = useState("loading");
  const [active, setActive] = useState(null);
  const [anchor, setAnchor] = useState(() => new Date());
  const [icsVersion, setIcsVersion] = useState(0);

  const days = useMemo(() => getMondayWeek(anchor), [anchor]);
  const todayKey = stockholmDateKey();

  const eventsByDay = useMemo(() => {
    const ics = icsRef.current;
    const grouped = Object.fromEntries(days.map((day) => [day.key, []]));
    if (!ics) {
      return grouped;
    }

    const weekEvents = parseEventsInRange(ics, days[0].start, days[6].end);
    for (const event of weekEvents) {
      const key = stockholmDateKey(new Date(event.start));
      if (grouped[key]) {
        grouped[key].push(event);
      }
    }
    return grouped;
  }, [days, icsVersion]);

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
        if (cancelled) {
          return;
        }
        icsRef.current = ics;
        setIcsVersion((value) => value + 1);
        setStatus("ready");
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

  const clocks = active ? formatEventClocks(active) : null;
  const kind = active ? eventKind(active.title) : null;

  return (
    <section className="calendar-part" id="week">
      <div className="title text-center">
        <p>Stockholm time · week starts Monday</p>
        <h1>This week on the floor</h1>
      </div>
      <div className="container">
        {status === "error" ? (
          <p className="today-status">Could not load the week view from the calendar feed.</p>
        ) : (
          <div className="calendar-frame week-rows-frame">
            <div className="week-rows-toolbar">
              <button
                type="button"
                className="week-rows-nav"
                onClick={() => setAnchor((current) => shiftStockholmDays(current, -7))}
              >
                Previous week
              </button>
              <p className="week-rows-label">{formatWeekRangeLabel(days)}</p>
              <div className="week-rows-toolbar-end">
                <button
                  type="button"
                  className="week-rows-nav"
                  onClick={() => setAnchor(new Date())}
                >
                  This week
                </button>
                <button
                  type="button"
                  className="week-rows-nav"
                  onClick={() => setAnchor((current) => shiftStockholmDays(current, 7))}
                >
                  Next week
                </button>
              </div>
            </div>
            <ol className="week-rows">
              {days.map((day) => {
                const events = eventsByDay[day.key] || [];
                return (
                  <li
                    key={day.key}
                    className={day.key === todayKey ? "week-row is-today" : "week-row"}
                  >
                    <div className="week-row-day">
                      <span className="week-row-weekday">{day.weekday}</span>
                      <span className="week-row-date">{day.day}</span>
                    </div>
                    <div className="week-row-events">
                      {events.length === 0 ? (
                        <p className="week-row-empty">Quiet night</p>
                      ) : (
                        events.map((event) => {
                          const eventKindName = eventKind(event.title);
                          const eventClocks = formatEventClocks(event);
                          return (
                            <button
                              key={event.id}
                              type="button"
                              className={`week-event week-event-${eventKindName || "other"}`}
                              onClick={() => setActive(event)}
                            >
                              <span className="week-event-time">
                                {eventClocks.end
                                  ? `${eventClocks.start}–${eventClocks.end}`
                                  : eventClocks.start}
                              </span>
                              <span className="week-event-title">
                                {displayTitle(event.title)}
                              </span>
                              {event.location ? (
                                <span className="week-event-venue">{event.location}</span>
                              ) : null}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        <p className="calendar-subscribe">
          <a href={CALENDAR_SUBSCRIBE_URL} target="_blank" rel="noreferrer">
            Add to Google Calendar
          </a>
        </p>
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

export default CalendarSection;
