import { CALENDAR_ICAL_URL } from "../src/site.js";

export default async function handler(req, res) {
  try {
    const response = await fetch(CALENDAR_ICAL_URL, {
      headers: { "User-Agent": "StockholmBachataCalendar/1.0" },
    });
    const body = await response.text();
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(response.ok ? 200 : response.status).send(body);
  } catch {
    res.status(502).send("Calendar feed failed");
  }
}
