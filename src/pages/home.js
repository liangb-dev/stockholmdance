import React from "react";
import Navbar from "../components/navbar/navbar";
import Banner from "../components/banner/banner";
import TodaySection from "../components/today/today";
import CalendarSection from "../components/calendar/calendar";
import HighlightsSection from "../components/highlights/highlights";
import Footer from "../components/footer/footer";
import {
  navitem,
  image,
  bgimg,
  bannerText,
  footerbg,
} from "../components/variables/variable";
import { FEEDBACK_EMAIL } from "../site";

function home() {
  return (
    <div>
      <Navbar name={navitem} logo={image} />
      <Banner bg={bgimg} text={bannerText} />
      <aside className="site-note">
        <p>
          <span className="site-note-label">Note</span>
          This calendar is maintained with AI assistance and is intended as a
          reference. Please confirm time and price on the organiser’s official
          page before you go. If something is wrong or missing,{" "}
          <a href={`mailto:${FEEDBACK_EMAIL}`}>get in touch</a>.
        </p>
      </aside>
      <TodaySection />
      <CalendarSection />
      <HighlightsSection />
      <Footer bg={footerbg} />
    </div>
  );
}

export default home;
