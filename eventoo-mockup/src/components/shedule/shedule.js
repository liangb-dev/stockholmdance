import React from "react";

function shedule(props) {
  const speaker = props.speaker.map((item) => (
    <div key={item.id} className="col-lg-6 col-md-6">
      <div className="speaker">
        <div className="img">
          <img src={item.img} alt={item.name} />
        </div>
        <div className="details">
          <div className="date">
            <p>{item.time}</p>
          </div>
          <h1 className="name">{item.name}</h1>
          <p className="desination">{item.designation}</p>
        </div>
      </div>
    </div>
  ));

  return (
    <div style={props.bg} className="shedule-part" id="nights">
      <div className="overlay">
        <div className="title">
          <p>{props.title.subheading}</p>
          <h1>{props.title.heading}</h1>
        </div>
        <div className="container">
          <div className="row">{speaker}</div>
        </div>
      </div>
    </div>
  );
}

export default shedule;
