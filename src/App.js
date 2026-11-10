import React, { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

import "./assets/css/bootstrap.min.css";
import "./assets/css/navbar.css";
import "./assets/css/banner.css";
import "./assets/css/footer.css";
import "./assets/css/responsive.css";
import "./assets/css/calendar.css";
import "./App.css";

import Home from "./pages/home";
import WeekendsPage from "./pages/weekends";

const ROUTES = new Set(["/", "/weekends"]);

function normalizePath(pathname) {
  const trimmed = String(pathname || "").replace(/\/+$/, "");
  return trimmed || "/";
}

function useRoute() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const sync = () => {
      setPath(normalizePath(window.location.pathname));
    };

    window.addEventListener("popstate", sync);

    const onClick = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = event.target.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      let url;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) {
        return;
      }

      const nextPath = normalizePath(url.pathname);
      if (!ROUTES.has(nextPath) || nextPath === normalizePath(window.location.pathname)) {
        return;
      }

      event.preventDefault();
      window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
      setPath(nextPath);
    };

    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("popstate", sync);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return path;
}

function App() {
  const path = useRoute();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    const target = document.querySelector(hash);
    if (target) {
      target.scrollIntoView();
    }
  }, [path]);

  return (
    <>
      {path === "/weekends" ? <WeekendsPage /> : <Home />}
      <Analytics />
    </>
  );
}

export default App;
