import assert from "node:assert/strict";
import test from "node:test";
import {
  detectHighlightKind,
  highlightKindLabel,
  isHighlightCandidate,
  parseHighlights,
} from "./highlights.js";

const START = new Date("2026-11-14T18:00:00Z");
const END = new Date("2026-11-14T22:59:00Z");

function evening(title, description = "", rrule = "") {
  return { title, description, start: START, end: END, rrule };
}

test("one-off parties and special nights are highlights", () => {
  const titles = [
    "Bachakizz Night (Bachata & Urban Kiz)",
    "November Party (Zouk) @ Birkagården",
    "Sip & Salsa XL (klasser, social & show) @ Sinclairs Sabor Latino",
    "VIBRA Bachata Day – workshops & social @ Enough Productions",
    "Autumn Gala – Workshop & Party @ Stockholm Salsa Dance",
    "El Grande Anniversary Party (Salsa & Bachata) @ Epic Studios",
    "New Year's Eve Party 2026 – Salsa, Bachata & Kizomba @ EPIC Studios",
    "ALMA – workshops & social",
    "DansPractica – workshop & social (Salsa Cubana)",
  ];

  for (const title of titles) {
    assert.equal(isHighlightCandidate(evening(title)), true, title);
    assert.equal(detectHighlightKind(title), "special", title);
  }
});

test("branded socials with a workshop programme are highlights", () => {
  const passion = evening(
    "PASIÓN! The Bachata Social @ USC Studios",
    "Workshops 19:00–20:30. Social med DJ BASE 21:00–01:00.",
  );
  const denim = evening(
    "El Grande Denim & Diamonds (Salsa & Bachata) @ Epic Studios",
    "Workshops 20:00–22:00. Party until 03:00.",
  );

  assert.equal(isHighlightCandidate(passion), true);
  assert.equal(isHighlightCandidate(denim), true);
  assert.equal(detectHighlightKind(passion.title, passion.description), "special");
  assert.equal(highlightKindLabel("special"), "Special");
});

test("ordinary one-off socials and classes stay off the list", () => {
  const ordinary = [
    evening("Studio Salsa – Bachata Social", "Sunday social, 18:00–21:00. Drop-in."),
    evening("Social in Birkagården (Zouk)", "A 2 hour dance evening. Drop-in."),
    evening(
      "Studio Salsa – Friday workshop",
      "Fredagsworkshop + practica. Bachata Footwork and Salsa LA Style.",
    ),
    evening(
      "Bachata Lady Styling workshop: Flow & Bodycontrol @ Vega",
      "Fördjupningsworkshop i Bachata Lady Styling. 1,5 timme.",
    ),
    evening(
      "Konsten att dansa - Salsa @ Nationalmuseum",
      "Gratis. Intro-workshop salsa. Social dans till salsa och bachata.",
    ),
    evening("iDance Bachata Night (Fri)", "Weekly bachata night.", "FREQ=WEEKLY;BYDAY=FR"),
    evening("CANCELLED – iDance Bachata Night (Fri)"),
  ];

  for (const event of ordinary) {
    assert.equal(isHighlightCandidate(event), false, event.title);
  }
});

test("festivals, weekends, and cruises keep their labels", () => {
  assert.equal(detectHighlightKind("Stockholm Bachata Weekend 2027"), "weekend");
  assert.equal(
    detectHighlightKind("Salsa- och Bachatakryssning @ Viking Line Gabriella"),
    "cruise",
  );
  assert.equal(
    detectHighlightKind("Bachata & Cuban Weekend 2027 (festival)"),
    "weekend",
  );
  assert.equal(isHighlightCandidate(evening("Stockholm Bachata Weekend 2027")), true);
});

test("parseHighlights keeps a special and drops a regular social", () => {
  const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:bachakizz
DTSTART:20261114T180000Z
DTEND:20261114T225900Z
SUMMARY:Bachakizz Night (Bachata & Urban Kiz)
DESCRIPTION:A night of bachata and urban kiz.
END:VEVENT
BEGIN:VEVENT
UID:studio
DTSTART:20261115T170000Z
DTEND:20261115T200000Z
SUMMARY:Studio Salsa – Bachata Social
DESCRIPTION:Sunday social drop-in.
END:VEVENT
BEGIN:VEVENT
UID:passion
DTSTART:20261113T180000Z
DTEND:20261113T225900Z
SUMMARY:PASIÓN! The Bachata Social @ USC Studios
DESCRIPTION:Workshops 19:00–20:30. Social med DJ BASE.
END:VEVENT
END:VCALENDAR
`;

  const titles = parseHighlights(ics, new Date("2026-11-10T12:00:00Z")).map(
    (item) => item.title,
  );
  assert.deepEqual(titles, [
    "PASIÓN! The Bachata Social @ USC Studios",
    "Bachakizz Night (Bachata & Urban Kiz)",
  ]);
});
