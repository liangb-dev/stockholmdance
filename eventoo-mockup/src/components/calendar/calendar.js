import React from "react";
import { CALENDAR_ID, SITE_NAME } from "../../site";

const embedUrl = `https://calendar.google.com/calendar/embed?${new URLSearchParams(
  {
    src: CALENDAR_ID,
    ctz: "Europe/Stockholm",
    mode: "WEEK",
    wkst: "2",
    showTitle: "0",
    showNav: "1",
    showDate: "1",
    showPrint: "0",
    showTabs: "1",
    showCalendars: "0",
    showTz: "0",
  },
).toString()}`;

function CalendarSection() {
  return (
    <section className="calendar-part" id="week">
      <div className="title text-center">
        <p>Stockholm time · week starts Monday</p>
        <h1>This week on the floor</h1>
      </div>
      <div className="container">
        <div className="calendar-frame">
          <iframe title={`${SITE_NAME} calendar`} src={embedUrl} />
        </div>
      </div>
    </section>
  );
}

export default CalendarSection;
