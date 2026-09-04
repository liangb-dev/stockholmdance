export const SITE_NAME = "Stockholm Bachata & Salsa";
export const SITE_KICKER = "This week's floor";
export const SITE_DESCRIPTION =
  "Drop-in classes. Packed socials. Parties people stay for. Bachata, salsa, and kizomba across the city — one calendar, less event-hunting.";
export const DANCE_STYLES = ["Bachata", "Salsa", "Kizomba"] as const;

export const CONTACT_EMAIL = "bernardxliang@gmail.com";

export const CALENDAR_TIMEZONE = "Europe/Stockholm";

/** How long the Google Calendar feed is reused before a background refresh. */
export const CALENDAR_SYNC_SECONDS = 120;

/** Public Google Calendar ID (group calendar). */
export const CALENDAR_ID =
  "f00d88b1c055af51f91f2fae1e5e1d47c9f1ee65d33b5f3337e2fa91fc1e5c74@group.calendar.google.com";

const CALENDAR_CID =
  "ZjAwZDg4YjFjMDU1YWY1MWY5MWYyZmFlMWU1ZTFkNDdjOWYxZWU2NWQzM2I1ZjMzMzdlMmZhOTFmYzFlNWM3NEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t";

/** Opens Google Calendar's "add this calendar" flow for any signed-in user. */
export const CALENDAR_SUBSCRIBE_URL = `https://calendar.google.com/calendar/render?cid=${CALENDAR_CID}`;

/** Public iCal feed for Apple Calendar, Outlook, and other clients. */
export const CALENDAR_ICAL_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

export type CalendarEmbedMode = "MONTH" | "WEEK" | "AGENDA";

/** Google Calendar iframe embed (Stockholm, week starts Monday). */
export function calendarEmbedUrl(mode: CalendarEmbedMode = "WEEK") {
  const params = new URLSearchParams({
    src: CALENDAR_ID,
    ctz: "Europe/Stockholm",
    mode,
    wkst: "2",
    showTitle: "0",
    showNav: "1",
    showDate: "1",
    showPrint: "0",
    showTabs: "1",
    showCalendars: "0",
    showTz: "0",
    bgcolor: "#f6efe6",
  });

  return `https://calendar.google.com/calendar/embed?${params.toString()}`;
}

export const CALENDAR_EMBED_URL = calendarEmbedUrl("WEEK");
