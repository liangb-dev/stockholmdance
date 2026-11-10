import React, { useEffect, useId, useRef, useState } from "react";
import EventDialog from "../event-dialog/event-dialog";
import FeedStatus from "../feed-status/feed-status";
import { highlightsPresentation } from "../../lib/calendar-feed";
import { useCalendarFeed } from "../../lib/use-calendar-feed";
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

function CategorySection({
  id,
  className,
  kicker,
  title,
  intro,
  items,
  todayKey,
  onOpen,
  notice,
  reason,
  refreshing,
  onRetry,
  headingId,
  retryLabel,
}) {
  if (!notice && items.length === 0) {
    return null;
  }

  return (
    <section className={className} id={id}>
      <div className="title text-center">
        <p>{kicker}</p>
        <h1 id={headingId} className="feed-heading" tabIndex={-1}>
          {title}
        </h1>
      </div>
      {intro ? <p className="highlights-intro">{intro}</p> : null}
      <div className="container">
        {notice ? (
          <FeedStatus
            notice={notice}
            reason={reason}
            refreshing={refreshing}
            onRetry={onRetry}
            headingId={headingId}
            retryLabel={retryLabel}
          />
        ) : null}
        {items.length > 0 ? (
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
        ) : null}
      </div>
    </section>
  );
}

function HighlightsSection({ onOpenHouseChange }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const feed = useCalendarFeed();
  const [active, setActive] = useState(null);
  const [todayKey, setTodayKey] = useState(() => stockholmDateKey());
  const readable = feed.status === "ready" || feed.status === "stale";
  const openHouses = readable ? parseOpenHouses(feed.body) : [];
  const festivals = readable ? parseHighlights(feed.body) : [];
  const presentation = highlightsPresentation(feed.status, openHouses.length + festivals.length);

  useEffect(() => {
    setTodayKey(stockholmDateKey());
  }, []);

  useEffect(() => {
    if (feed.status === "loading") {
      return;
    }
    if (feed.status === "ready" || feed.status === "stale") {
      onOpenHouseChange?.(openHouses.length > 0);
      return;
    }
    onOpenHouseChange?.(false);
  }, [feed.status, feed.body, openHouses.length, onOpenHouseChange]);

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

  if (presentation.hidden) {
    return null;
  }

  const activeOngoing = active ? isHighlightOngoing(active, todayKey) : false;
  const showHouses = openHouses.length > 0;
  const notice = presentation.notice
    ? {
        notice: presentation.notice,
        reason: feed.reason,
        refreshing: feed.refreshing,
        onRetry: feed.retry,
      }
    : null;

  return (
    <>
      {showHouses ? (
        <CategorySection
          id="open-house"
          className="highlights-part open-house-part"
          kicker="free to try"
          title="Open house"
          intro="Drop in and try a class — öppet hus from the calendar."
          items={openHouses}
          todayKey={todayKey}
          onOpen={setActive}
          headingId="open-house-heading"
          retryLabel="Try loading open houses again"
          {...(notice || {})}
        />
      ) : null}
      <CategorySection
        id="highlights"
        className="highlights-part"
        kicker="upcoming and ongoing"
        title="Weekends & festivals"
        intro="From the calendar — festivals, weekends, and cruises."
        items={festivals}
        todayKey={todayKey}
        onOpen={setActive}
        headingId="highlights-heading"
        retryLabel="Try loading festivals again"
        {...(!showHouses || festivals.length > 0 ? notice || {} : {})}
      />

      <EventDialog
        dialogRef={dialogRef}
        titleId={titleId}
        onClose={() => setActive(null)}
        title={active?.title || ""}
        kindLabel={active ? highlightKindLabel(active.kind) : ""}
        tone={active?.kind || ""}
        when={active ? formatHighlightDates(active) : ""}
        where={active?.venue || ""}
        mapsQuery={active?.mapsQuery || ""}
        ongoing={activeOngoing}
        description={active?.description || ""}
        sourceUrl={active?.sourceUrl || ""}
        shareId={active?.id || ""}
      />
    </>
  );
}

export default HighlightsSection;
