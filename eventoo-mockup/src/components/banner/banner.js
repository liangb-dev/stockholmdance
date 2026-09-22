import React from "react";
import BannerText from "./banner-text";

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
        </div>
      </div>
    </section>
  );
}

export default banner;
