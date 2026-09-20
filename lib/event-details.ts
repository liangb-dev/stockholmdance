export type EventPhaseKind = "class" | "social" | "other";

export type EventPhase = {
  kind: EventPhaseKind;
  label: string;
  time: string;
};

const TIME_RANGE =
  /(\d{1,2}[:.]\d{2})\s*[–—\-]\s*(\d{1,2}[:.]?\d{0,2})/u;

function normalizeClock(raw: string) {
  const cleaned = raw.replace(".", ":");
  if (/^\d{1,2}$/.test(cleaned)) {
    return `${cleaned.padStart(2, "0")}:00`;
  }

  const [hours, minutes = "00"] = cleaned.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

function formatRange(start: string, end: string) {
  return `${normalizeClock(start)}–${normalizeClock(end)}`;
}

function classifyPhase(label: string): EventPhaseKind {
  if (/class|drop-?in|kurs|workshop|lesson|lektion/i.test(label)) {
    return "class";
  }

  if (/social|party|socialdans|dansfest/i.test(label)) {
    return "social";
  }

  return "other";
}

function shortPhaseLabel(kind: EventPhaseKind, raw: string) {
  if (kind === "class") {
    return "Class";
  }

  if (kind === "social") {
    return "Social";
  }

  const trimmed = raw.replace(/^[\s–—:\-]+/, "").trim();
  if (!trimmed) {
    return "Session";
  }

  return trimmed.split(/[,.(]/)[0]?.trim().slice(0, 28) || "Session";
}

function decodeIcsText(value: string) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/** Plain-text calendar description for UI (modals, blurbs). */
export function cleanEventDescription(description: string) {
  return decodeIcsText(description)
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Pull class/social schedule lines from a calendar description. */
export function parseEventPhases(description: string): EventPhase[] {
  const text = decodeIcsText(description);
  const phases: EventPhase[] = [];
  const seen = new Set<string>();

  const labeled = [
    ...text.matchAll(
      /(?:^|\n)\s*(Workshops?|Class(?:es)?|Drop-?in(?:\s+kurs)?|Kurs|Social(?:dans)?|Party)\s*:\s*([^\n]+)/gi,
    ),
  ];

  for (const match of labeled) {
    const heading = match[1] ?? "";
    const rest = match[2] ?? "";
    const times = rest.match(TIME_RANGE);
    if (!times) {
      continue;
    }

    const time = formatRange(times[1]!, times[2]!);
    const kind = classifyPhase(`${heading} ${rest}`);
    const key = `${kind}:${time}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    phases.push({
      kind,
      label: shortPhaseLabel(kind, heading),
      time,
    });
  }

  if (phases.length >= 2) {
    return phases.slice(0, 3);
  }

  for (const line of text.split(/\n+/)) {
    const match = line.match(
      /^\s*(\d{1,2}[:.]\d{2})\s*[–—\-]\s*(\d{1,2}[:.]?\d{0,2})\s*[–—:\-]*\s*(.+)$/u,
    );
    if (!match) {
      continue;
    }

    const labelText = match[3] ?? "";
    const kind = classifyPhase(labelText);
    if (kind === "other" && phases.length === 0) {
      continue;
    }

    const time = formatRange(match[1]!, match[2]!);
    const key = `${kind}:${time}`;
    if (seen.has(key)) {
      continue;
    }

    // Prefer the main room / primary social over side rooms.
    if (/small room/i.test(labelText) && phases.some((phase) => phase.kind === "social")) {
      continue;
    }

    seen.add(key);
    phases.push({
      kind,
      label: shortPhaseLabel(kind, labelText),
      time,
    });

    if (phases.length >= 3) {
      break;
    }
  }

  return phases;
}

function kr(amount: string) {
  return `${amount} kr`;
}

/** Build a short door/ticket price label from a calendar description. */
export function parseEventPrice(description: string): string {
  const text = decodeIcsText(description);

  if (/\bfree\b/i.test(text) && !/\d+\s*(?:kr|sek)/i.test(text)) {
    return "Free";
  }

  const classSocial = text.match(/Class\s*\+\s*Social:\s*(\d+)\s*(?:kr|SEK)/i);
  const socialOnly = text.match(/Social\s*only:\s*(\d+)\s*(?:kr|SEK)/i);
  if (classSocial && socialOnly) {
    return `${socialOnly[1]}–${classSocial[1]} kr`;
  }

  const entrySocial = text.match(/Entry\s*Social:\s*(\d+)\s*kr/i);
  const entryCourse = text.match(/Entry\s*\+\s*course:\s*(\d+)\s*kr/i);
  if (entrySocial && entryCourse) {
    return `${entrySocial[1]}–${entryCourse[1]} kr`;
  }

  const memberFree = text.match(/Non-?Member:\s*(\d+)\s*(?:kr|SEK)/i);
  if (memberFree) {
    return `${kr(memberFree[1]!)} · members free`;
  }

  const labeled = text.match(
    /(?:pris|price|förköp|biljetter från|one price)\s*[:.]?\s*(\d+)\s*(?:kr|SEK)/i,
  );
  if (labeled) {
    return kr(labeled[1]!);
  }

  const perVisit = text.match(/(\d+)\s*(?:kr|SEK)\s*\/\s*gång/i);
  if (perVisit) {
    return kr(perVisit[1]!);
  }

  const atDoor = text.match(/(\d+)\s*(?:kr|SEK)\s+at the door/i);
  if (atDoor) {
    return kr(atDoor[1]!);
  }

  const donation = text.match(/donation of\s*(\d+)\s*(?:kr|SEK)/i);
  if (donation) {
    return `${donation[1]} kr donation`;
  }

  const generic = text.match(/(\d+)\s*(?:kr|SEK)\b/i);
  if (generic) {
    return kr(generic[1]!);
  }

  return "";
}

export function parseSourceUrl(description: string): string {
  const text = decodeIcsText(description);
  const labeled = text.match(
    /(?:Källa|Tickets?|Biljetter|Länk|Link|Info|Website)\s*:\s*(https?:\/\/\S+)/i,
  );
  if (labeled) {
    return labeled[1]!.replace(/[.,);]+$/, "");
  }

  const bare = text.match(/(https?:\/\/[^\s\\]+)/i);
  return bare ? bare[1]!.replace(/[.,);]+$/, "") : "";
}
