import React, { useEffect, useId, useRef, useState } from "react";
import EventDialog from "../event-dialog/event-dialog";
import FeedStatus from "../feed-status/feed-status";
import { todayPresentation } from "../../lib/calendar-feed";
import { useCalendarFeed } from "../../lib/use-calendar-feed";
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
            {kind ? (
              <span className={`today-kind today-kind-${kind}`}>
                <span className="today-kind-label">{KIND_LABEL[kind]}</span>
              </span>
            ) : null}
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
  const feed = useCalendarFeed();
  const [active, setActive] = useState(null);
  const parsed =
    (feed.status === "ready" || feed.status === "stale") && feed.body
      ? parseTodaysEvents(feed.body)
      : null;
  const presentation = todayPresentation(feed.status, parsed?.events.length ?? 0);

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
  if (parsed && presentation.events) {
    for (const event of parsed.events) {
      grouped[eventStatus(event)].push(event);
    }
  }

  const clocks = active ? formatEventClocks(active) : null;
  const kind = active ? eventKind(active.title) : null;

  return (
    <section className="today-part" id="today">
      <div className="title text-center">
        <p>{parsed ? parsed.label : "Stockholm time"}</p>
        <h1 id="today-heading" className="feed-heading" tabIndex={-1}>
          Today on the floor
        </h1>
      </div>
      <div className="container">
        {presentation.notice ? (
          <FeedStatus
            notice={presentation.notice}
            reason={feed.reason}
            refreshing={feed.refreshing}
            onRetry={feed.retry}
            headingId="today-heading"
            retryLabel="Try loading today’s events again"
            alert
          />
        ) : null}
        {presentation.empty ? (
          <p className="today-status">
            Quiet floor tonight. Check the week view below.
          </p>
        ) : null}
        {presentation.events ? (
          <ul className="today-groups">
            <EventGroup title="Happening now" events={grouped.now} onOpen={setActive} />
            <EventGroup title="Coming up" events={grouped.upcoming} onOpen={setActive} />
            <EventGroup title="Earlier today" events={grouped.past} onOpen={setActive} />
          </ul>
        ) : null}
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

export default TodaySection;
