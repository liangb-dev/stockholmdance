import { descriptionPrice } from "./event-details.js";
import {
  formatHighlightDates,
  highlightKindLabel,
  isHighlightOngoing,
  parseHighlights,
  parseOpenHouses,
  stockholmDateKey,
} from "./highlights.js";
import {
  displayTitle,
  eventKind,
  formatEventClocks,
  parseEventsInRange,
} from "./today.js";

const KIND_LABEL = {
  bachata: "Bachata",
  salsa: "Salsa",
  kizomba: "Kizomba",
  zouk: "Zouk",
};

export function eventShareKey(id) {
  return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function eventShareUrl(id, href = "http://localhost/") {
  const key = eventShareKey(id);
  if (!key) {
    return "";
  }
  const url = new URL(href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("event", key);
  return url.toString();
}

export function readSharedEventKey(href = "http://localhost/") {
  return new URL(href).searchParams.get("event")?.trim() || "";
}

export function clearSharedEventUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("event")) {
    return;
  }
  url.searchParams.delete("event");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}

function addMonths(date, months) {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

export function findSharedEvent(ics, key, now = new Date()) {
  const wanted = eventShareKey(key);
  if (!wanted || !ics) {
    return null;
  }

  const from = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
  const to = addMonths(now, 18);
  const calendarEvent = parseEventsInRange(ics, from, to).find(
    (event) => eventShareKey(event.id) === wanted,
  );
  if (calendarEvent) {
    return { kind: "calendar", event: calendarEvent };
  }

  const openHouse = parseOpenHouses(ics, now).find(
    (event) => eventShareKey(event.id) === wanted,
  );
  if (openHouse) {
    return { kind: "highlight", event: openHouse };
  }

  const highlight = parseHighlights(ics, now).find(
    (event) => eventShareKey(event.id) === wanted,
  );
  if (highlight) {
    return { kind: "highlight", event: highlight };
  }

  return null;
}

export function sharedDialogModel(found, now = new Date()) {
  if (!found) {
    return null;
  }

  if (found.kind === "highlight") {
    const event = found.event;
    return {
      shareId: event.id,
      title: event.title,
      kindLabel: highlightKindLabel(event.kind),
      tone: event.kind || "",
      when: formatHighlightDates(event),
      where: event.venue || "",
      mapsQuery: event.mapsQuery || "",
      price: descriptionPrice(event.description || ""),
      ongoing: isHighlightOngoing(event, stockholmDateKey(now)),
      description: event.description || "",
      sourceUrl: event.sourceUrl || "",
    };
  }

  const event = found.event;
  const kind = eventKind(event.title);
  const clocks = formatEventClocks(event);
  return {
    shareId: event.id,
    title: displayTitle(event.title),
    kindLabel: kind ? KIND_LABEL[kind] : "",
    tone: kind || "",
    when: clocks.end ? `${clocks.start}–${clocks.end}` : clocks.start,
    where: event.location || "",
    mapsQuery: event.mapsQuery || "",
    price: event.priceLabel || "",
    ongoing: false,
    description: event.description || "",
    sourceUrl: event.sourceUrl || "",
  };
}
