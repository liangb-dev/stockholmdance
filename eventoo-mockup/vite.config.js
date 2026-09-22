import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";

const CALENDAR_ICAL_URL =
  "https://calendar.google.com/calendar/ical/f00d88b1c055af51f91f2fae1e5e1d47c9f1ee65d33b5f3337e2fa91fc1e5c74%40group.calendar.google.com/public/basic.ics";

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
        server.middlewares.use(async (req, res, next) => {
          if (req.url !== "/api/calendar.ics") {
            next();
            return;
          }

          try {
            const response = await fetch(CALENDAR_ICAL_URL, {
              headers: { "User-Agent": "StockholmBachataCalendar/1.0" },
            });
            const body = await response.text();
            res.statusCode = response.ok ? 200 : response.status;
            res.setHeader("Content-Type", "text/calendar; charset=utf-8");
            res.end(body);
          } catch {
            res.statusCode = 502;
            res.end("Calendar feed failed");
          }
        });
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
