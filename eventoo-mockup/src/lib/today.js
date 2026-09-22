import {
  cleanEventDescription,
  cleanHighlightTitle,
  parseSourceUrl,
  stockholmDateKey,
} from "./highlights";

const TIMEZONE = "Europe/Stockholm";
const WEEKDAY = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

const DANCE_KIND_PATTERNS = [
  ["bachata", /bachata/i],
  ["salsa", /salsa|mambo/i],
  ["kizomba", /kizomba/i],
  ["zouk", /zouk/i],
];

const TIME_RANGE = /(\d{1,2}[:.]\d{2})\s*[–—\-]\s*(\d{1,2}[:.]?\d{0,2})/u;

function decodeIcsText(value) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function getOffsetMs(date, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - date.getTime();
}

function zonedLocalToUtc(year, month, day, hour = 0, minute = 0, second = 0) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = getOffsetMs(new Date(utcGuess), TIMEZONE);
  return new Date(utcGuess - offset);
}

function calendarParts(date) {
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

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function clockParts(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function unfoldIcs(ics) {
  return ics.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function eventProp(block, name) {
  const match = block.match(new RegExp(`^${name}(;[^:]*)?:(.*)$`, "m"));
  return match ? { params: match[1] || "", value: match[2] || "" } : null;
}

function eventProps(block, name) {
  const matches = [...block.matchAll(new RegExp(`^${name}(;[^:]*)?:(.*)$`, "gm"))];
  return matches.map((match) => ({ params: match[1] || "", value: match[2] || "" }));
}

function parseDateValue(params, raw) {
  const value = raw.trim();
  if (/VALUE=DATE/i.test(params) || /^\d{8}$/.test(value)) {
    const stamp = value.slice(0, 8);
    const year = Number(stamp.slice(0, 4));
    const month = Number(stamp.slice(4, 6));
    const day = Number(stamp.slice(6, 8));
    return { date: zonedLocalToUtc(year, month, day), allDay: true };
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);

  if (match[7] === "Z") {
    return {
      date: new Date(Date.UTC(year, month - 1, day, hour, minute, second)),
      allDay: false,
    };
  }

  return {
    date: zonedLocalToUtc(year, month, day, hour, minute, second),
    allDay: false,
  };
}

function shortLocation(value) {
  const firstPart = decodeIcsText(value).split(",")[0]?.trim() ?? "";
  return firstPart.replace(/\s+/g, " ");
}

function kr(amount) {
  return `${amount} kr`;
}

export function parseEventPrice(description) {
  const text = decodeIcsText(description);

  if (/\bfree\b/i.test(text) && !/\d+\s*(?:kr|sek)/i.test(text)) {
    return "Free";
  }

  const classSocial = text.match(/Class\s*\+\s*Social:\s*(\d+)\s*(?:kr|SEK)/i);
  const socialOnly = text.match(/Social\s*only:\s*(\d+)\s*(?:kr|SEK)/i);
  if (classSocial && socialOnly) {
    return `${socialOnly[1]}–${classSocial[1]} kr`;
  }

  const labeled = text.match(
    /(?:pris|price|förköp|biljetter från|one price)\s*[:.]?\s*(\d+)\s*(?:kr|SEK)/i,
  );
  if (labeled) {
    return kr(labeled[1]);
  }

  const generic = text.match(/(\d+)\s*(?:kr|SEK)\b/i);
  if (generic) {
    return kr(generic[1]);
  }

  return "";
}

function normalizeClock(raw) {
  const cleaned = raw.replace(".", ":");
  if (/^\d{1,2}$/.test(cleaned)) {
    return `${cleaned.padStart(2, "0")}:00`;
  }
  const [hours, minutes = "00"] = cleaned.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

function classifyPhase(label) {
  if (/class|drop-?in|kurs|workshop|lesson|lektion/i.test(label)) {
    return "class";
  }
  if (/social|party|socialdans|dansfest/i.test(label)) {
    return "social";
  }
  return "other";
}

export function parseEventPhases(description) {
  const text = decodeIcsText(description);
  const phases = [];
  const seen = new Set();

  for (const match of text.matchAll(
    /(?:^|\n)\s*(Workshops?|Class(?:es)?|Drop-?in(?:\s+kurs)?|Kurs|Social(?:dans)?|Party)\s*:\s*([^\n]+)/gi,
  )) {
    const times = match[2].match(TIME_RANGE);
    if (!times) {
      continue;
    }
    const kind = classifyPhase(`${match[1]} ${match[2]}`);
    const time = `${normalizeClock(times[1])}–${normalizeClock(times[2])}`;
    const key = `${kind}:${time}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    phases.push({
      kind,
      label: kind === "class" ? "Class" : kind === "social" ? "Social" : match[1],
      time,
    });
  }

  return phases.slice(0, 3);
}

export function eventKind(title) {
  let match = null;
  let earliest = Number.POSITIVE_INFINITY;
  for (const [kind, pattern] of DANCE_KIND_PATTERNS) {
    const index = title.search(pattern);
    if (index >= 0 && index < earliest) {
      earliest = index;
      match = kind;
    }
  }
  return match;
}

export function eventStatus(event, now = new Date()) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  if (end.getTime() <= now.getTime()) {
    return "past";
  }
  if (start.getTime() <= now.getTime()) {
    return "now";
  }
  return "upcoming";
}

function formatClock(isoDate) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(isoDate));
}

export function formatEventClocks(event) {
  if (event.isAllDay) {
    return { start: "All day", end: "" };
  }
  return { start: formatClock(event.start), end: formatClock(event.end) };
}

export function formatTodayLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function stockholmWeekday(date) {
  const { year, month, day } = calendarParts(date);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

function rruleMap(rrule) {
  const map = {};
  for (const part of rrule.split(";")) {
    const [key, value] = part.split("=");
    if (key && value) {
      map[key] = value;
    }
  }
  return map;
}

function overlapsDay(start, end, dayStart, dayEnd) {
  return start.getTime() < dayEnd.getTime() && end.getTime() > dayStart.getTime();
}

function weeklyInstance(start, end, todayParts) {
  const clock = clockParts(start);
  const instanceStart = zonedLocalToUtc(
    todayParts.year,
    todayParts.month,
    todayParts.day,
    clock.hour,
    clock.minute,
    clock.second,
  );
  const instanceEnd = new Date(instanceStart.getTime() + (end.getTime() - start.getTime()));
  return { start: instanceStart, end: instanceEnd };
}

export function parseTodaysEvents(ics, now = new Date()) {
  const unfolded = unfoldIcs(ics);
  const todayParts = calendarParts(now);
  const todayKey = stockholmDateKey(now);
  const todayWeekday = stockholmWeekday(now);
  const dayStart = zonedLocalToUtc(todayParts.year, todayParts.month, todayParts.day);
  const dayEnd = zonedLocalToUtc(todayParts.year, todayParts.month, todayParts.day, 23, 59, 59);
  const seen = new Set();
  const events = [];

  for (const chunk of unfolded.split("BEGIN:VEVENT").slice(1)) {
    const block = chunk.split("END:VEVENT")[0] || "";
    if ((eventProp(block, "STATUS")?.value || "") === "CANCELLED") {
      continue;
    }
    if (eventProp(block, "RECURRENCE-ID")) {
      continue;
    }

    const summary = decodeIcsText(eventProp(block, "SUMMARY")?.value || "").trim();
    if (!summary) {
      continue;
    }

    const startProp = eventProp(block, "DTSTART");
    const endProp = eventProp(block, "DTEND");
    const startParsed = startProp ? parseDateValue(startProp.params, startProp.value) : null;
    if (!startParsed) {
      continue;
    }

    let endParsed = endProp ? parseDateValue(endProp.params, endProp.value) : null;
    if (!endParsed) {
      const end = new Date(startParsed.date.getTime());
      end.setUTCDate(end.getUTCDate() + (startParsed.allDay ? 1 : 0));
      endParsed = { date: end, allDay: startParsed.allDay };
    }

    const rrule = eventProp(block, "RRULE")?.value || "";
    const uid = eventProp(block, "UID")?.value || summary;
    let instanceStart = startParsed.date;
    let instanceEnd = endParsed.date;
    let isRecurring = Boolean(rrule);

    if (rrule) {
      const rule = rruleMap(rrule);
      if (rule.FREQ !== "WEEKLY") {
        if (!overlapsDay(startParsed.date, endParsed.date, dayStart, dayEnd)) {
          continue;
        }
      } else {
        const days = (rule.BYDAY || "")
          .split(",")
          .map((code) => WEEKDAY[code.slice(-2)])
          .filter((day) => day !== undefined);
        const matchesDay =
          days.length > 0
            ? days.includes(todayWeekday)
            : stockholmWeekday(startParsed.date) === todayWeekday;
        if (!matchesDay) {
          continue;
        }
        if (startParsed.date.getTime() > dayEnd.getTime()) {
          continue;
        }
        if (rule.UNTIL) {
          const until = parseDateValue("", rule.UNTIL);
          if (until && until.date.getTime() < dayStart.getTime()) {
            continue;
          }
        }
        const interval = Number(rule.INTERVAL || "1");
        if (interval > 1) {
          const startKey = stockholmDateKey(startParsed.date);
          const weeks = Math.round(
            (Date.parse(`${todayKey}T12:00:00Z`) - Date.parse(`${startKey}T12:00:00Z`)) /
              604800000,
          );
          if (weeks % interval !== 0) {
            continue;
          }
        }

        const exdates = eventProps(block, "EXDATE").flatMap((item) =>
          item.value.split(",").map((stamp) => parseDateValue(item.params, stamp)),
        );
        const excluded = exdates.some(
          (item) => item && stockholmDateKey(item.date) === todayKey,
        );
        if (excluded) {
          continue;
        }

        const moved = weeklyInstance(startParsed.date, endParsed.date, todayParts);
        instanceStart = moved.start;
        instanceEnd = moved.end;
      }
    } else if (!overlapsDay(startParsed.date, endParsed.date, dayStart, dayEnd)) {
      continue;
    }

    const id = `${uid}-${instanceStart.getTime()}`;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    const rawDescription = eventProp(block, "DESCRIPTION")?.value || "";
    events.push({
      id,
      title: summary,
      location: shortLocation(eventProp(block, "LOCATION")?.value || ""),
      start: instanceStart.toISOString(),
      end: instanceEnd.toISOString(),
      isAllDay: startParsed.allDay,
      isRecurring,
      priceLabel: parseEventPrice(rawDescription),
      phases: parseEventPhases(rawDescription),
      sourceUrl: parseSourceUrl(rawDescription),
      description: cleanEventDescription(rawDescription),
    });
  }

  return {
    events: events
      .filter((event) => event.title)
      .sort((a, b) => a.start.localeCompare(b.start)),
    label: formatTodayLabel(now),
    dateKey: todayKey,
    fetchedAt: now.toISOString(),
  };
}

export function displayTitle(title) {
  return cleanHighlightTitle(title);
}
