import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";
import { CALENDAR_ICAL_URL } from "./src/site.js";
import { calendarProxyResult, isRefreshRequest } from "./src/lib/calendar-feed.js";

function writeCalendarResult(res, result) {
  res.statusCode = result.status;
  for (const [key, value] of Object.entries(result.headers)) {
    res.setHeader(key, value);
  }
  res.end(result.body);
}

function calendarIcsProxy() {
  return async (req, res, next) => {
    const path = (req.url || "").split("?")[0];
    if (path !== "/api/calendar.ics") {
      next();
      return;
    }

    const refresh = isRefreshRequest(req.url);
    try {
      const response = await fetch(CALENDAR_ICAL_URL, {
        headers: { "User-Agent": "StockholmBachataCalendar/1.0" },
      });
      const body = await response.text();
      writeCalendarResult(
        res,
        calendarProxyResult({
          upstreamOk: response.ok,
          upstreamBody: body,
          refresh,
        }),
      );
    } catch {
      writeCalendarResult(
        res,
        calendarProxyResult({ upstreamOk: false, upstreamBody: "", refresh }),
      );
    }
  };
}

export default defineConfig({
  plugins: [
    {
      name: "js-as-jsx",
      async transform(code, id) {
        if (!id.match(/\/src\/.*\.js$/)) {
          return null;
        }

        return transformWithEsbuild(code, id, {
          loader: "jsx",
          jsx: "automatic",
        });
      },
    },
    {
      name: "calendar-ics-proxy",
      configureServer(server) {
        server.middlewares.use(calendarIcsProxy());
      },
      configurePreviewServer(server) {
        server.middlewares.use(calendarIcsProxy());
      },
    },
    react(),
  ],
  server: {
    port: 5180,
    strictPort: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
});
