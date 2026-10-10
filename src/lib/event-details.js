const DAY_HEADING =
  /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{1,2}\s+[A-Za-z]{3,}(?:\s+·\s+(.+))?$/;
const TIME_LINE =
  /^(\d{1,2}[:.]\d{2})\s*[–—-]\s*(?:(\d{1,2}(?:[:.]\d{2})?)\s*)?[:.]?\s*(.*)$/;
const LABEL_ONLY = /^(pass|program|källa|source|tickets?|biljetter|länk|link|info|website)\s*:?\s*$/i;
const SOURCE_LINE = /^(?:källa|source|tickets?|biljetter|länk|link|info|website)\s*:/i;

function normalizeClock(raw) {
  if (!raw) {
    return "";
  }
  const cleaned = raw.replace(".", ":");
  const [hours, minutes = "00"] = cleaned.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0").slice(0, 2)}`;
}

function matchTime(line) {
  const match = line.match(TIME_LINE);
  if (!match) {
    return null;
  }
  const start = normalizeClock(match[1]);
  const end = normalizeClock(match[2]);
  return {
    time: end ? `${start}–${end}` : start,
    label: (match[3] || "").replace(/^[:.\s]+/, "").trim(),
  };
}

function parseBlocks(lines) {
  const blocks = [];
  let textBuffer = [];

  const flushText = () => {
    const text = textBuffer.join(" ").replace(/\s+/g, " ").trim();
    textBuffer = [];
    if (text) {
      blocks.push({ type: "text", text });
    }
  };

  for (const line of lines) {
    if (!line) {
      flushText();
      continue;
    }
    if (LABEL_ONLY.test(line) || SOURCE_LINE.test(line) || /^https?:\/\/\S+$/i.test(line)) {
      flushText();
      continue;
    }
    const time = matchTime(line);
    if (time) {
      flushText();
      blocks.push({ type: "slot", ...time });
      continue;
    }
    if (line.endsWith(":") && line.length < 72) {
      flushText();
      blocks.push({ type: "subhead", text: line.replace(/:$/, "") });
      continue;
    }
    textBuffer.push(line);
  }

  flushText();
  return blocks;
}

function leadingText(blocks) {
  const texts = [];
  for (const block of blocks) {
    if (block.type !== "text") {
      break;
    }
    texts.push(block.text);
  }
  return texts;
}

export function descriptionPrice(text) {
  const labeled = text.match(/(?:pris|price)\s*:\s*([^\n]+)/i);
  if (labeled) {
    const amount = labeled[1].match(/(\d+)\s*kr/i);
    return amount ? `${amount[1]} kr` : labeled[1].trim();
  }
  if (/\b(?:gratis|free)\b/i.test(text)) {
    return "Free";
  }
  return "";
}

export function sourceHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function layoutDescription(description) {
  const lines = String(description || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim());

  const sections = [];
  let current = { heading: "", place: "", lines: [] };

  for (const line of lines) {
    const day = line.match(DAY_HEADING);
    if (day) {
      if (current.heading || current.lines.some(Boolean)) {
        sections.push(current);
      }
      current = {
        heading: line.split("·")[0].trim(),
        place: (day[1] && day[2] ? day[2] : "").trim(),
        lines: [],
      };
      continue;
    }
    current.lines.push(line);
  }

  if (current.heading || current.lines.some(Boolean)) {
    sections.push(current);
  }

  const parsed = sections
    .map((section) => ({
      heading: section.heading,
      place: section.place,
      blocks: parseBlocks(section.lines),
    }))
    .filter((section) => section.heading || section.blocks.length > 0);

  if (parsed.length === 0) {
    return { intro: [], sections: [] };
  }

  let intro = [];
  if (parsed.length > 1) {
    const leads = parsed.map((section) => leadingText(section.blocks));
    const first = leads[0].join("\n");
    if (first && leads.every((lead) => lead.join("\n") === first)) {
      intro = leads[0];
      for (const section of parsed) {
        section.blocks = section.blocks.slice(intro.length);
      }
    }
  }

  return { intro, sections: parsed };
}
