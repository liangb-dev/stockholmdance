import React, { useState } from "react";
import Navbar from "../components/navbar/navbar";
import Banner from "../components/banner/banner";
import TodaySection from "../components/today/today";
import AffordableSection from "../components/affordable/affordable";
import CalendarSection from "../components/calendar/calendar";
import HighlightsSection from "../components/highlights/highlights";
import Footer from "../components/footer/footer";
import SharedEvent from "../components/shared-event/shared-event";
import {
  navitem,
  image,
  bgimg,
  bannerText,
  footerbg,
} from "../components/variables/variable";
import { FEEDBACK_EMAIL } from "../site";

function home() {
  const [showOpenHouse, setShowOpenHouse] = useState(true);
  const [showFree, setShowFree] = useState(true);
  const links = navitem.filter((item) => {
    if (item.link === "#open-house" && !showOpenHouse) {
      return false;
    }
    if (item.link === "#free" && !showFree) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <Navbar name={links} logo={image} />
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
      <SharedEvent />
      <TodaySection />
      <AffordableSection onAvailabilityChange={setShowFree} />
      <CalendarSection />
      <HighlightsSection onOpenHouseChange={setShowOpenHouse} />
      <Footer bg={footerbg} showOpenHouse={showOpenHouse} showFree={showFree} />
    </div>
  );
}

export default home;
