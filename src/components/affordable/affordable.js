import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import EventDialog from "../event-dialog/event-dialog";
import { stockholmDateKey } from "../../lib/highlights";
import { useCalendarFeed } from "../../lib/use-calendar-feed";
import {
  displayTitle,
  eventKind,
  formatEventClocks,
  upcomingAffordableEvents,
} from "../../lib/today";

const KIND_LABEL = {
  bachata: "Bachata",
  salsa: "Salsa",
  kizomba: "Kizomba",
  zouk: "Zouk",
};

function dayLabel(iso) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Stockholm",
  }).format(new Date(iso));
}

function AffordableSection({ onAvailabilityChange }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const feed = useCalendarFeed();
  const [active, setActive] = useState(null);
  const readable = (feed.status === "ready" || feed.status === "stale") && feed.body;
  const events = useMemo(
    () => (readable ? upcomingAffordableEvents(feed.body) : []),
    [readable, feed.body],
  );

  useEffect(() => {
    if (feed.status === "loading") {
      return;
    }
    onAvailabilityChange?.(readable ? events.length > 0 : false);
  }, [feed.status, readable, events.length, onAvailabilityChange]);

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

  if (!readable || events.length === 0) {
    return null;
  }

  const groups = [];
  for (const event of events) {
    const key = stockholmDateKey(new Date(event.start));
    const group = groups.find((item) => item.key === key);
    if (group) {
      group.events.push(event);
    } else {
      groups.push({ key, label: dayLabel(event.start), events: [event] });
    }
  }

  const clocks = active ? formatEventClocks(active) : null;
  const kind = active ? eventKind(active.title) : null;

  return (
    <section className="today-part free-part" id="free">
      <div className="title text-center">
        <p>the next three weeks</p>
        <h1>Free &amp; under 80 kr</h1>
      </div>
      <p className="highlights-intro">
        Drop-ins that are free, or cost under 80 kr.
      </p>
      <div className="container">
        <ul className="today-groups">
          {groups.map((group) => (
            <li key={group.key}>
              <h3>{group.label}</h3>
              <ul>
                {group.events.map((event) => {
                  const eventClocks = formatEventClocks(event);
                  const eventKindName = eventKind(event.title);
                  return (
                    <li key={event.id} className="today-event">
                      <button type="button" onClick={() => setActive(event)}>
                        <time dateTime={event.start}>
                          <span>{eventClocks.start}</span>
                          {eventClocks.end ? <span>{eventClocks.end}</span> : null}
                        </time>
                        <div>
                          <p className="today-event-title">{displayTitle(event.title)}</p>
                          <p className="today-event-meta">
                            {event.location ? <span>{event.location}</span> : null}
                            <span className="price-chip">{event.affordablePriceLabel}</span>
                            {eventKindName ? (
                              <span className={`today-kind today-kind-${eventKindName}`}>
                                <span className="today-kind-label">{KIND_LABEL[eventKindName]}</span>
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <EventDialog
        dialogRef={dialogRef}
        titleId={titleId}
        onClose={() => setActive(null)}
        title={active ? displayTitle(active.title) : ""}
        kindLabel={kind ? KIND_LABEL[kind] : ""}
        tone={kind || ""}
        when={clocks ? (clocks.end ? `${clocks.start}–${clocks.end}` : clocks.start) : ""}
        where={active?.location || ""}
        mapsQuery={active?.mapsQuery || ""}
        price={active?.priceLabel || ""}
        description={active?.description || ""}
        sourceUrl={active?.sourceUrl || ""}
        shareId={active?.id || ""}
      />
    </section>
  );
}

export default AffordableSection;
