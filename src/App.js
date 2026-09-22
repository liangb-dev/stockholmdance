import React from "react";
import { Analytics } from "@vercel/analytics/react";

import "./assets/css/bootstrap.min.css";
import "./assets/css/navbar.css";
import "./assets/css/banner.css";
import "./assets/css/footer.css";
import "./assets/css/responsive.css";
import "./assets/css/calendar.css";
import "./App.css";

import Home from "./pages/home";

function App() {
  return (
    <>
      <Home />
      <Analytics />
    </>
  );
}

export default App;
