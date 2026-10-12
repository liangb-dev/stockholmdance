const TIMEZONE = "Europe/Stockholm";
const HIGHLIGHT_TITLE =
  /\b(festival|weekend|cruise|kryssning|congress|bootcamp|intensive)\b/i;
const OPEN_HOUSE_TITLE = /öppet\s*hus|öppethus|open\s*house/i;
const WEEKLY_RULE = /FREQ=WEEKLY/i;

export function stockholmDateKey(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function decodeIcsText(value) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

export function cleanEventDescription(description) {
  return decodeIcsText(description)
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseSourceUrl(description) {
  const text = decodeIcsText(description);
  const labeled = text.match(
    /(?:Källa|Tickets?|Biljetter|Länk|Link|Info|Website)\s*:\s*(https?:\/\/\S+)/i,
  );
  if (labeled) {
    return labeled[1].replace(/[.,);]+$/, "");
  }

  const bare = text.match(/(https?:\/\/[^\s\\]+)/i);
  return bare ? bare[1].replace(/[.,);]+$/, "") : "";
}

export function highlightKindLabel(kind) {
  if (kind === "open-house") {
    return "Open house";
  }
  if (kind === "cruise") {
    return "Cruise";
  }
  if (kind === "weekend") {
    return "Weekend";
  }
  return "Festival";
}

export function isOpenHouseTitle(title) {
  return OPEN_HOUSE_TITLE.test(cleanHighlightTitle(title));
}

export function detectHighlightKind(title) {
  if (/\b(cruise|kryssning)\b/i.test(title)) {
    return "cruise";
  }
  if (/\bweekend\b/i.test(title)) {
    return "weekend";
  }
  return "festival";
}

export function cleanHighlightTitle(title) {
  return title
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Component}\s]+/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function highlightBlurb(description, maxLength = 140) {
  const plain = description
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) {
    return "";
  }

  if (plain.length <= maxLength) {
    return plain;
  }

  const slice = plain.slice(0, maxLength - 1);
  const cut = slice.lastIndexOf(" ");
  return `${(cut > 60 ? slice.slice(0, cut) : slice).trim()}…`;
}

function shiftDateKey(dateKey, deltaDays) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}

export function inclusiveEndDateKey(start, end) {
  const startKey = stockholmDateKey(start);
  let endKey = stockholmDateKey(end);

  if (endKey < startKey) {
    return startKey;
  }

  const endHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      hour: "numeric",
      hourCycle: "h23",
    }).format(end),
  );
  const endMinute = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      minute: "numeric",
    }).format(end),
  );

  if (endKey > startKey && endHour === 0 && endMinute === 0) {
    endKey = shiftDateKey(endKey, -1);
  }

  return endKey < startKey ? startKey : endKey;
}

function daySpanInclusive(startKey, endKey) {
  const start = Date.parse(`${startKey}T12:00:00Z`);
  const end = Date.parse(`${endKey}T12:00:00Z`);
  return Math.floor((end - start) / 86_400_000) + 1;
}

export function isHighlightCandidate(input) {
  if (input.rrule && WEEKLY_RULE.test(input.rrule)) {
    return false;
  }

  const title = cleanHighlightTitle(input.title);
  if (!title || isOpenHouseTitle(title)) {
    return false;
  }

  if (HIGHLIGHT_TITLE.test(title)) {
    return true;
  }

  const startKey = stockholmDateKey(input.start);
  const endKey = inclusiveEndDateKey(input.start, input.end);
  const daySpan = daySpanInclusive(startKey, endKey);
  const durationHours =
    (input.end.getTime() - input.start.getTime()) / (1000 * 60 * 60);

  if (daySpan >= 3) {
    return true;
  }

  return daySpan >= 2 && durationHours >= 20;
}

export function isHighlightOngoing(highlight, todayKey) {
  return highlight.startDate <= todayKey && highlight.endDate >= todayKey;
}

export function upcomingHighlights(todayKey, items) {
  return items
    .filter((item) => item.endDate >= todayKey)
    .sort((a, b) => {
      const aOngoing = isHighlightOngoing(a, todayKey) ? 0 : 1;
      const bOngoing = isHighlightOngoing(b, todayKey) ? 0 : 1;
      if (aOngoing !== bOngoing) {
        return aOngoing - bOngoing;
      }

      return (
        a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title)
      );
    });
}

export function formatHighlightDates(highlight) {
  const start = parseDateOnly(highlight.startDate);
  const end = parseDateOnly(highlight.endDate);

  if (highlight.startDate === highlight.endDate) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(start);
  }

  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    const monthYear = new Intl.DateTimeFormat("en-GB", {
      month: "short",
      year: "numeric",
    }).format(start);
    return `${start.getUTCDate()}–${end.getUTCDate()} ${monthYear}`;
  }

  const startLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(end);

  return `${startLabel} – ${endLabel}`;
}

function parseDateOnly(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function unfoldIcs(ics) {
  return ics.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function parseDateValue(raw) {
  const value = raw.trim();
  if (/^\d{8}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    return { date: new Date(Date.UTC(year, month - 1, day)), allDay: true };
  }

  const match = value.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/,
  );
  if (!match) {
    return null;
  }

  const iso = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}${match[7] || "Z"}`;
  return { date: new Date(iso), allDay: false };
}

function eventProp(block, name) {
  const match = block.match(new RegExp(`^${name}(;[^:]*)?:(.*)$`, "m"));
  return match ? { params: match[1] || "", value: match[2] || "" } : null;
}

function fullLocation(value) {
  return decodeIcsText(value).replace(/\s+/g, " ").trim();
}

function shortLocation(value) {
  return fullLocation(value).split(",")[0]?.trim() ?? "";
}

function addMonths(date, months) {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

export function parseHighlights(ics, now = new Date()) {
  const unfolded = unfoldIcs(ics);
  const todayKey = stockholmDateKey(now);
  const horizon = addMonths(now, 18);
  const seen = new Set();
  const highlights = [];

  for (const chunk of unfolded.split("BEGIN:VEVENT").slice(1)) {
    const block = chunk.split("END:VEVENT")[0] || "";
    const status = eventProp(block, "STATUS")?.value || "";
    if (status === "CANCELLED") {
      continue;
    }

    const summary = decodeIcsText(eventProp(block, "SUMMARY")?.value || "").trim();
    const rrule = eventProp(block, "RRULE")?.value || "";
    const uid = eventProp(block, "UID")?.value || summary;
    const startProp = eventProp(block, "DTSTART");
    const endProp = eventProp(block, "DTEND");
    const startParsed = startProp ? parseDateValue(startProp.value) : null;
    if (!startParsed) {
      continue;
    }

    let endParsed = endProp ? parseDateValue(endProp.value) : null;
    if (!endParsed) {
      const end = new Date(startParsed.date.getTime());
      end.setUTCDate(end.getUTCDate() + (startParsed.allDay ? 1 : 0));
      endParsed = { date: end, allDay: startParsed.allDay };
    }

    if (
      !isHighlightCandidate({
        title: summary,
        start: startParsed.date,
        end: endParsed.date,
        rrule,
      })
    ) {
      continue;
    }

    if (endParsed.date < now || startParsed.date > horizon) {
      continue;
    }

    const id = `${uid}-${startParsed.date.getTime()}`;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    const rawDescription = eventProp(block, "DESCRIPTION")?.value || "";
    const description = cleanEventDescription(rawDescription);

    highlights.push({
      id,
      title: cleanHighlightTitle(summary),
      kind: detectHighlightKind(summary),
      startDate: stockholmDateKey(startParsed.date),
      endDate: inclusiveEndDateKey(startParsed.date, endParsed.date),
      venue: shortLocation(eventProp(block, "LOCATION")?.value || ""),
      mapsQuery: fullLocation(eventProp(block, "LOCATION")?.value || ""),
      blurb: highlightBlurb(description),
      description,
      sourceUrl: parseSourceUrl(rawDescription),
    });
  }

  return upcomingHighlights(todayKey, highlights);
}

function openHouseGroupKey(title) {
  const cleaned = cleanHighlightTitle(title).toLowerCase();
  const at = cleaned.lastIndexOf("@");
  if (at >= 0) {
    return cleaned.slice(at + 1).trim();
  }

  const head = cleaned.split(/öppet\s*hus|öppethus|open\s*house/i)[0] || "";
  const words = head
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word && !/^(gratis|free)$/i.test(word));

  if (words.length > 0) {
    return words.join(" ");
  }

  const tail = cleaned.split(/[|@]/).slice(1).join(" ").trim();
  return tail || cleaned;
}

function titleStem(title) {
  return cleanHighlightTitle(title)
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+[–—-]\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clusterTitle(items) {
  if (items.length === 1) {
    return cleanHighlightTitle(items[0].title);
  }

  const stems = items
    .map((item) => titleStem(item.title))
    .filter((stem) => OPEN_HOUSE_TITLE.test(stem));
  const pool = stems.length > 0 ? stems : items.map((item) => titleStem(item.title));
  return pool.sort((a, b) => a.length - b.length)[0];
}

function formatOpenHouseDay(dateKey) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(parseDateOnly(dateKey));
}

function clusterOpenHouses(items) {
  const groups = new Map();
  for (const item of items) {
    const key = openHouseGroupKey(item.title);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }

  const clusters = [];
  for (const group of groups.values()) {
    const sorted = group.sort(
      (a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title),
    );
    let current = [];
    for (const item of sorted) {
      const previous = current[current.length - 1];
      const gap = previous ? daySpanInclusive(previous.startDate, item.startDate) - 1 : 0;
      if (previous && gap > 2) {
        clusters.push(current);
        current = [item];
      } else {
        current.push(item);
      }
    }
    if (current.length > 0) {
      clusters.push(current);
    }
  }

  return clusters.map((cluster) => {
    const venues = [];
    const queries = [];
    for (const item of cluster) {
      if (item.venue && !venues.includes(item.venue)) {
        venues.push(item.venue);
      }
      if (item.mapsQuery && !queries.includes(item.mapsQuery)) {
        queries.push(item.mapsQuery);
      }
    }

    const description =
      cluster.length === 1
        ? cluster[0].description
        : cluster
            .map((item) => {
              const heading = [formatOpenHouseDay(item.startDate), item.venue]
                .filter(Boolean)
                .join(" · ");
              return item.description ? `${heading}\n${item.description}` : heading;
            })
            .join("\n\n");

    const endDate = cluster.reduce(
      (latest, item) => (item.endDate > latest ? item.endDate : latest),
      cluster[0].endDate,
    );

    return {
      id: `open-house-${cluster[0].startDate}-${openHouseGroupKey(cluster[0].title)}`,
      title: clusterTitle(cluster),
      kind: "open-house",
      startDate: cluster[0].startDate,
      endDate,
      venue: venues.join(" · "),
      mapsQuery: queries.length === 1 ? queries[0] : "",
      blurb: highlightBlurb(cluster[0].description),
      description,
      sourceUrl: cluster.find((item) => item.sourceUrl)?.sourceUrl || "",
    };
  });
}

export function parseOpenHouses(ics, now = new Date()) {
  const unfolded = unfoldIcs(ics);
  const todayKey = stockholmDateKey(now);
  const horizon = addMonths(now, 18);
  const seen = new Set();
  const instances = [];

  for (const chunk of unfolded.split("BEGIN:VEVENT").slice(1)) {
    const block = chunk.split("END:VEVENT")[0] || "";
    const status = eventProp(block, "STATUS")?.value || "";
    if (status === "CANCELLED") {
      continue;
    }

    const summary = decodeIcsText(eventProp(block, "SUMMARY")?.value || "").trim();
    if (!isOpenHouseTitle(summary)) {
      continue;
    }

    const rrule = eventProp(block, "RRULE")?.value || "";
    if (rrule && WEEKLY_RULE.test(rrule)) {
      continue;
    }

    const uid = eventProp(block, "UID")?.value || summary;
    const startProp = eventProp(block, "DTSTART");
    const endProp = eventProp(block, "DTEND");
    const startParsed = startProp ? parseDateValue(startProp.value) : null;
    if (!startParsed) {
      continue;
    }

    let endParsed = endProp ? parseDateValue(endProp.value) : null;
    if (!endParsed) {
      const end = new Date(startParsed.date.getTime());
      end.setUTCDate(end.getUTCDate() + (startParsed.allDay ? 1 : 0));
      endParsed = { date: end, allDay: startParsed.allDay };
    }

    if (endParsed.date < now || startParsed.date > horizon) {
      continue;
    }

    const id = `${uid}-${startParsed.date.getTime()}`;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    const rawDescription = eventProp(block, "DESCRIPTION")?.value || "";
    instances.push({
      title: summary,
      startDate: stockholmDateKey(startParsed.date),
      endDate: inclusiveEndDateKey(startParsed.date, endParsed.date),
      venue: shortLocation(eventProp(block, "LOCATION")?.value || ""),
      mapsQuery: fullLocation(eventProp(block, "LOCATION")?.value || ""),
      description: cleanEventDescription(rawDescription),
      sourceUrl: parseSourceUrl(rawDescription),
    });
  }

  return upcomingHighlights(todayKey, clusterOpenHouses(instances));
}
