import React from "react";

function vediobtn(props) {
  return (
    <div className="icon">
      <span className="vdo">{props.videobtn.text}</span>
      <a href={props.videobtn.href || "#week"}>
        <i className={props.videobtn.iconClassName} aria-hidden="true"></i>
      </a>
    </div>
  );
}

export default vediobtn;
