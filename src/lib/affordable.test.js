import assert from "node:assert/strict";
import test from "node:test";
import {
  affordablePriceLabel,
  parseEventPrice,
} from "./today.js";

test("gratis and free with no kronor amount count as free", () => {
  assert.equal(parseEventPrice("Gratis. Insläpp från 17:15."), "Free");
  assert.equal(affordablePriceLabel("Gratis. Insläpp från 17:15."), "Free");
  assert.equal(affordablePriceLabel("Drop-in, beginners friendly, free."), "Free");
});

test("a price under 80 kr is included and 80 kr is not", () => {
  assert.equal(affordablePriceLabel("75 SEK at the door."), "75 kr");
  assert.equal(affordablePriceLabel("Price: 50 kr"), "50 kr");
  assert.equal(affordablePriceLabel("One price: 80 kr"), "");
  assert.equal(affordablePriceLabel("120 kr"), "");
});

test("a cheaper member price is labeled from that amount", () => {
  assert.equal(affordablePriceLabel("120 kr (75 kr medlemmar)."), "From 75 kr");
});

test("a discount or a pass-holder freebie does not make a paid night cheap", () => {
  assert.equal(
    affordablePriceLabel("Tickets: 210 kr presale, 250 kr at the door, student discount 20 kr."),
    "",
  );
  assert.equal(
    affordablePriceLabel("Pris: socialdans 100 kr. Gratis för elever med periodkurs."),
    "",
  );
});

test("euro prices are not treated as kronor", () => {
  assert.equal(affordablePriceLabel("Saturday pass: 69€ Sunday pass: 69€"), "");
});
