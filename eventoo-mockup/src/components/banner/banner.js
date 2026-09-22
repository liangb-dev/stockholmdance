import React from "react";
import BannerText from "./banner-text";
import Button from "../navbar/registerbutton/navbtn";
import { CALENDAR_SUBSCRIBE_URL } from "../../site";

function banner(props) {
  return (
    <section style={props.bg} className="banner-part">
      <div className="overlay">
        <div className="container p-0">
          <BannerText
            sub={props.text.subHeading}
            heading={props.text.heading}
            details={props.text.details}
          />
          <a className="banner-cta" href={CALENDAR_SUBSCRIBE_URL}>
            <Button />
          </a>
        </div>
      </div>
    </section>
  );
}

export default banner;
