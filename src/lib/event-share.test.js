import assert from "node:assert/strict";
import test from "node:test";
import {
  eventShareKey,
  eventShareUrl,
  findSharedEvent,
  readSharedEventKey,
  sharedDialogModel,
} from "./event-share.js";
import { parseOpenHouses } from "./highlights.js";
import { parseEventsInRange } from "./today.js";

const NOW = new Date("2026-11-10T12:00:00Z");

const ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:share-me@example.com
DTSTART:20261112T180000Z
DTEND:20261112T210000Z
SUMMARY:Bachata social
LOCATION:The Hall, Stockholm
DESCRIPTION:Price: 120 kr
END:VEVENT
BEGIN:VEVENT
UID:house-1
DTSTART;VALUE=DATE:20261115
DTEND;VALUE=DATE:20261116
SUMMARY:Öppet hus @ Studio North
DESCRIPTION:Gratis drop-in
END:VEVENT
END:VCALENDAR
`;

test("share keys stay url-safe and round-trip through the link", () => {
  const key = eventShareKey("share-me@example.com-123");
  assert.equal(key, "share-me_example_com-123");
  assert.equal(eventShareKey(key), key);

  const url = eventShareUrl("share-me@example.com-123", "https://dance.example/week?x=1#today");
  assert.equal(url, "https://dance.example/week?event=share-me_example_com-123");
  assert.equal(readSharedEventKey(url), key);
  assert.equal(eventShareUrl("", "https://dance.example/"), "");
  assert.equal(readSharedEventKey("https://dance.example/"), "");
});

test("a shared link finds the same calendar event and its dialog details", () => {
  const from = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
  const to = new Date(NOW.getTime() + 14 * 24 * 60 * 60 * 1000);
  const event = parseEventsInRange(ICS, from, to).find((item) => item.title === "Bachata social");
  assert.ok(event);

  const found = findSharedEvent(ICS, eventShareKey(event.id), NOW);
  assert.equal(found?.kind, "calendar");
  assert.equal(found.event.id, event.id);

  const model = sharedDialogModel(found, NOW);
  assert.equal(model.title, "Bachata social");
  assert.equal(model.kindLabel, "Bachata");
  assert.equal(model.where, "The Hall");
  assert.equal(model.price, "120 kr");
  assert.equal(model.when, "19:00–22:00");
  assert.match(eventShareUrl(model.shareId, "https://dance.example/"), /event=/);
  assert.equal(findSharedEvent(ICS, "missing-event", NOW), null);
});

test("a shared open house link opens the grouped visit", () => {
  const house = parseOpenHouses(ICS, NOW).find((item) => item.title.includes("Studio North"));
  assert.ok(house);

  const found = findSharedEvent(ICS, eventShareKey(house.id), NOW);
  assert.equal(found?.kind, "highlight");
  const model = sharedDialogModel(found, NOW);
  assert.equal(model.kindLabel, "Open house");
  assert.match(model.title, /Studio North/);
  assert.equal(model.price, "Free");
});
