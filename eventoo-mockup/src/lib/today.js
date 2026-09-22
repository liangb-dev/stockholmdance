import {
  cleanEventDescription,
  cleanHighlightTitle,
  inclusiveEndDateKey,
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

export function shiftStockholmDays(date, days) {
  const parts = calendarParts(date);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12));
}

export function getMondayWeek(date = new Date()) {
  const offset = (stockholmWeekday(date) + 6) % 7;

  return Array.from({ length: 7 }, (_, index) => {
    const dayDate = shiftStockholmDays(date, index - offset);
    const parts = calendarParts(dayDate);
    return {
      key: stockholmDateKey(dayDate),
      date: dayDate,
      day: parts.day,
      weekday: new Intl.DateTimeFormat("en-GB", {
        timeZone: TIMEZONE,
        weekday: "short",
      }).format(dayDate),
      weekdayLong: new Intl.DateTimeFormat("en-GB", {
        timeZone: TIMEZONE,
        weekday: "long",
      }).format(dayDate),
      start: zonedLocalToUtc(parts.year, parts.month, parts.day),
      end: zonedLocalToUtc(parts.year, parts.month, parts.day, 23, 59, 59),
    };
  });
}

export function formatWeekRangeLabel(days) {
  const first = days[0]?.date;
  const last = days[6]?.date;
  if (!first || !last) {
    return "";
  }

  const start = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
  }).format(first);
  const end = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(last);

  return `${start} – ${end}`;
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

function weeklyInstance(start, end, dayParts) {
  const clock = clockParts(start);
  const instanceStart = zonedLocalToUtc(
    dayParts.year,
    dayParts.month,
    dayParts.day,
    clock.hour,
    clock.minute,
    clock.second,
  );
  const instanceEnd = new Date(
    instanceStart.getTime() + (end.getTime() - start.getTime()),
  );
  return { start: instanceStart, end: instanceEnd };
}

function shiftDateKey(dateKey, deltaDays) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}

function eachStockholmDay(from, to) {
  const days = [];
  let key = stockholmDateKey(from);
  const endKey = stockholmDateKey(to);

  while (key <= endKey) {
    const [year, month, day] = key.split("-").map(Number);
    days.push({ year, month, day, key });
    key = shiftDateKey(key, 1);
  }

  return days;
}

function toEventRecord({
  uid,
  summary,
  location,
  start,
  end,
  isAllDay,
  isRecurring,
  rawDescription,
}) {
  return {
    id: `${uid}-${start.getTime()}`,
    title: summary,
    location,
    start: start.toISOString(),
    end: end.toISOString(),
    isAllDay,
    isRecurring,
    priceLabel: parseEventPrice(rawDescription),
    phases: parseEventPhases(rawDescription),
    sourceUrl: parseSourceUrl(rawDescription),
    description: cleanEventDescription(rawDescription),
  };
}

export function parseEventsInRange(ics, from, to) {
  const unfolded = unfoldIcs(ics);
  const seen = new Set();
  const events = [];
  const days = eachStockholmDay(from, to);

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
    const startParsed = startProp
      ? parseDateValue(startProp.params, startProp.value)
      : null;
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
    const location = shortLocation(eventProp(block, "LOCATION")?.value || "");
    const rawDescription = eventProp(block, "DESCRIPTION")?.value || "";
    const push = (start, end, isRecurring) => {
      const record = toEventRecord({
        uid,
        summary,
        location,
        start,
        end,
        isAllDay: startParsed.allDay,
        isRecurring,
        rawDescription,
      });
      if (seen.has(record.id)) {
        return;
      }
      seen.add(record.id);
      events.push(record);
    };

    if (rrule) {
      const rule = rruleMap(rrule);
      if (rule.FREQ !== "WEEKLY") {
        if (overlapsDay(startParsed.date, endParsed.date, from, to)) {
          push(startParsed.date, endParsed.date, true);
        }
        continue;
      }

      const weekdays = (rule.BYDAY || "")
        .split(",")
        .map((code) => WEEKDAY[code.slice(-2)])
        .filter((day) => day !== undefined);
      const until = rule.UNTIL ? parseDateValue("", rule.UNTIL) : null;
      const interval = Number(rule.INTERVAL || "1");
      const startKey = stockholmDateKey(startParsed.date);
      const exdates = new Set(
        eventProps(block, "EXDATE")
          .flatMap((item) =>
            item.value.split(",").map((stamp) => parseDateValue(item.params, stamp)),
          )
          .filter(Boolean)
          .map((item) => stockholmDateKey(item.date)),
      );

      for (const day of days) {
        const weekday = new Date(Date.UTC(day.year, day.month - 1, day.day, 12)).getUTCDay();
        const matchesDay =
          weekdays.length > 0
            ? weekdays.includes(weekday)
            : stockholmWeekday(startParsed.date) === weekday;
        if (!matchesDay || day.key < startKey || exdates.has(day.key)) {
          continue;
        }
        if (until && until.date.getTime() < zonedLocalToUtc(day.year, day.month, day.day).getTime()) {
          continue;
        }
        if (interval > 1) {
          const weeks = Math.round(
            (Date.parse(`${day.key}T12:00:00Z`) - Date.parse(`${startKey}T12:00:00Z`)) /
              604800000,
          );
          if (weeks % interval !== 0) {
            continue;
          }
        }

        const moved = weeklyInstance(startParsed.date, endParsed.date, day);
        if (overlapsDay(moved.start, moved.end, from, to)) {
          push(moved.start, moved.end, true);
        }
      }
      continue;
    }

    if (overlapsDay(startParsed.date, endParsed.date, from, to)) {
      push(startParsed.date, endParsed.date, false);
    }
  }

  return events.sort((a, b) => a.start.localeCompare(b.start));
}

export function parseTodaysEvents(ics, now = new Date()) {
  const todayParts = calendarParts(now);
  const dayStart = zonedLocalToUtc(todayParts.year, todayParts.month, todayParts.day);
  const dayEnd = zonedLocalToUtc(
    todayParts.year,
    todayParts.month,
    todayParts.day,
    23,
    59,
    59,
  );

  return {
    events: parseEventsInRange(ics, dayStart, dayEnd),
    label: formatTodayLabel(now),
    dateKey: stockholmDateKey(now),
    fetchedAt: now.toISOString(),
  };
}

export function displayTitle(title) {
  return cleanHighlightTitle(title);
}

export function toScheduleXEvents(events) {
  return events.flatMap((event) => {
    try {
      const kind = eventKind(event.title) || "other";
      const mapped = {
        id: String(event.id).replace(/[^a-zA-Z0-9_-]/g, "_"),
        title: displayTitle(event.title),
        location: event.location,
        description: event.description,
        calendarId: kind,
        sourceUrl: event.sourceUrl,
        priceLabel: event.priceLabel,
        phases: event.phases,
        rawTitle: event.title,
        _options: {
          disableDND: true,
          disableResize: true,
        },
      };

      if (event.isAllDay) {
        const start = new Date(event.start);
        const end = new Date(event.end);
        return [
          {
            ...mapped,
            start: Temporal.PlainDate.from(stockholmDateKey(start)),
            end: Temporal.PlainDate.from(inclusiveEndDateKey(start, end)),
          },
        ];
      }

      return [
        {
          ...mapped,
          start: Temporal.Instant.from(event.start).toZonedDateTimeISO(
            "Europe/Stockholm",
          ),
          end: Temporal.Instant.from(event.end).toZonedDateTimeISO(
            "Europe/Stockholm",
          ),
        },
      ];
    } catch {
      return [];
    }
  });
}

export function temporalToDate(value) {
  if (!value) {
    return new Date();
  }
  if (typeof value.epochMilliseconds === "number") {
    return new Date(value.epochMilliseconds);
  }
  if (typeof value.toString === "function") {
    return new Date(value.toString().replace(/\[.*\]$/, ""));
  }
  return new Date(value);
}
