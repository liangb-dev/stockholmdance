import React from "react";

function bannerText(props) {
  return (
    <div className="homebanner">
      <p>{props.sub}</p>
      <h1>{props.heading}</h1>
      {props.details ? <p className="banner-lead">{props.details}</p> : null}
    </div>
  );
}

export default bannerText;
