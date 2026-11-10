import assert from "node:assert/strict";
import test from "node:test";
import { layoutDescription } from "./event-details.js";

test("bullet workshop lines stay a schedule instead of one paragraph", () => {
  const layout = layoutDescription(`Bachakizz Night — a night of bachata & urban kiz.
📅 Sat Nov 14, 19:00 – 04:00
📍 Venue not stated in the text — check the event page.

Includes: workshops + social dancing.

WORKSHOPS
Bachata
• 19:00–20:00 Bachata styling (Open level)
• 20:00–21:00 Bachata partnerwork (Nybörjare/Fortsättning)
Urban Kiz
• 20:00–21:00 Urban kiz partnerwork (Nybörjare/Fortsättning)
Social dancing after the workshops.

TICKETS
Presale (limited): Workshop + social 240 kr
At the door: Workshop + social 260 kr
`);

  const blocks = layout.sections[0].blocks;
  assert.deepEqual(
    blocks.filter((block) => block.type === "text").map((block) => block.text),
    [
      "Bachakizz Night — a night of bachata & urban kiz.",
      "📅 Sat Nov 14, 19:00 – 04:00",
      "📍 Venue not stated in the text — check the event page.",
      "Includes: workshops + social dancing.",
      "Social dancing after the workshops.",
      "Presale (limited): Workshop + social 240 kr",
      "At the door: Workshop + social 260 kr",
    ],
  );
  assert.deepEqual(
    blocks.filter((block) => block.type === "slot").map((block) => block.time),
    ["19:00–20:00", "20:00–21:00", "20:00–21:00"],
  );
  assert.deepEqual(
    blocks.filter((block) => block.type === "subhead").map((block) => block.text),
    ["WORKSHOPS", "Bachata", "Urban Kiz", "TICKETS"],
  );
});

test("a line that already starts with a time stays a schedule row", () => {
  const layout = layoutDescription(`Full day of workshops.

13:00–14:00 TBA
14:00–15:00 Bzouk with Rickard and Rebecka
`);
  const blocks = layout.sections[0].blocks;
  assert.equal(blocks[0].type, "text");
  assert.deepEqual(
    blocks.slice(1).map((block) => `${block.time} ${block.label}`),
    ["13:00–14:00 TBA", "14:00–15:00 Bzouk with Rickard and Rebecka"],
  );
});

test("source links stay out of the body", () => {
  const layout = layoutDescription(`Workshops öppen nivå.

Biljetter: https://almaevents.se
Källa: https://example.com/event
`);
  const texts = layout.sections[0].blocks.map((block) => block.text);
  assert.deepEqual(texts, ["Workshops öppen nivå."]);
});
