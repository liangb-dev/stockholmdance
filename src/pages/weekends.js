import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar/navbar";
import HighlightsSection from "../components/highlights/highlights";
import Footer from "../components/footer/footer";
import SharedEvent from "../components/shared-event/shared-event";
import { navitem, image, footerbg } from "../components/variables/variable";
import { FEEDBACK_EMAIL, SITE_NAME } from "../site";

function WeekendsPage() {
  const [showOpenHouse, setShowOpenHouse] = useState(true);
  const links = showOpenHouse
    ? navitem
    : navitem.filter((item) => item.link !== "/#open-house");

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Weekends & festivals · ${SITE_NAME}`;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="page-weekends">
      <Navbar name={links} logo={image} />
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
      <HighlightsSection festivalsOnly onOpenHouseChange={setShowOpenHouse} />
      <Footer bg={footerbg} showOpenHouse={showOpenHouse} />
    </div>
  );
}

export default WeekendsPage;
