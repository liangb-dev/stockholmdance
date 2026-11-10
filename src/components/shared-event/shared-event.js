import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import EventDialog from "../event-dialog/event-dialog";
import {
  clearSharedEventUrl,
  findSharedEvent,
  readSharedEventKey,
  sharedDialogModel,
} from "../../lib/event-share";
import { useCalendarFeed } from "../../lib/use-calendar-feed";

function SharedEvent() {
  const feed = useCalendarFeed();
  const dialogRef = useRef(null);
  const titleId = useId();
  const [key, setKey] = useState(() => readSharedEventKey(window.location.href));

  const resolved = useMemo(() => {
    if (!key) {
      return { state: "idle" };
    }
    if (!feed.body) {
      return feed.status === "loading" ? { state: "loading" } : { state: "missing" };
    }
    const found = findSharedEvent(feed.body, key);
    if (!found) {
      return { state: "missing" };
    }
    return { state: "found", model: sharedDialogModel(found) };
  }, [key, feed.body, feed.status]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || resolved.state === "idle" || resolved.state === "loading") {
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
  }, [resolved]);

  function onClose() {
    clearSharedEventUrl();
    setKey("");
  }

  if (resolved.state !== "found" && resolved.state !== "missing") {
    return null;
  }

  const model = resolved.model;

  return (
    <EventDialog
      dialogRef={dialogRef}
      titleId={titleId}
      onClose={onClose}
      shareId={model?.shareId || ""}
      title={model?.title || "Event unavailable"}
      kindLabel={model?.kindLabel || ""}
      tone={model?.tone || ""}
      when={model?.when || ""}
      where={model?.where || ""}
      mapsQuery={model?.mapsQuery || ""}
      price={model?.price || ""}
      ongoing={model?.ongoing || false}
      description={
        model?.description ||
        "This event is no longer on the calendar. It may have passed or been removed."
      }
      sourceUrl={model?.sourceUrl || ""}
    />
  );
}

export default SharedEvent;
