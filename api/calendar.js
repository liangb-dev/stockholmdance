import { CALENDAR_ICAL_URL } from "../src/site.js";
import { calendarProxyResult, isRefreshRequest } from "../src/lib/calendar-feed.js";

function sendResult(res, result) {
  res.status(result.status);
  for (const [key, value] of Object.entries(result.headers)) {
    res.setHeader(key, value);
  }
  res.send(result.body);
}

export default async function handler(req, res) {
  const refresh = isRefreshRequest(req.url);
  try {
    const response = await fetch(CALENDAR_ICAL_URL, {
      headers: { "User-Agent": "StockholmBachataCalendar/1.0" },
    });
    const body = await response.text();
    sendResult(
      res,
      calendarProxyResult({
        upstreamOk: response.ok,
        upstreamBody: body,
        refresh,
      }),
    );
  } catch {
    sendResult(res, calendarProxyResult({ upstreamOk: false, upstreamBody: "", refresh }));
  }
}
