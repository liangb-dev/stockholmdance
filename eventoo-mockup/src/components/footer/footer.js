import React from "react";
import { CALENDAR_SUBSCRIBE_URL, FEEDBACK_EMAIL, SITE_NAME } from "../../site";

function footer(props) {
  const year = new Date().getFullYear();

  return (
    <section style={props.bg} className="footer-part" id="contact">
      <div className="title">
        <p>stockholm dance calendar</p>
        <h2>See you on the floor</h2>
      </div>
      <div className="fotermenu">
        <ul>
          <li>
            <a href="#today">Today</a>
          </li>
          <li>
            <a href="#week">Calendar</a>
          </li>
          <li>
            <a href="#highlights">Highlights</a>
          </li>
          <li>
            <a href={CALENDAR_SUBSCRIBE_URL} target="_blank" rel="noreferrer">
              Add to Google
            </a>
          </li>
          <li>
            <a href={`mailto:${FEEDBACK_EMAIL}`}>Contact</a>
          </li>
        </ul>
      </div>
      <div className="copy">
        <span>
          &copy; {year} {SITE_NAME}
        </span>
      </div>
    </section>
  );
}

export default footer;
