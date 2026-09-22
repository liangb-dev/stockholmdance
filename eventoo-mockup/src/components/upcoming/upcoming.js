import React from "react";
import Location from "./upcominglocation";
import Button from "./upcomingbutton";

function upcoming(props) {
  const event = props.event.map((item) => (
    <div key={item.id} className="col-lg-12">
      <div className="event">
        <div className="img">
          <img src={item.img} alt={item.title} />
        </div>
        <div className="details">
          <h2>{item.title}</h2>
          <Location
            locationimg={item.locationIcon}
            phoneimg={item.phone}
            address={item.address}
            number={item.number}
          />
        </div>
        <div className="button">
          <a href="#week">
            <Button />
          </a>
        </div>
      </div>
    </div>
  ));

  return (
    <div className="upcoming-part" id="highlights">
      <div className="title text-center">
        <p>{props.title.subheading}</p>
        <h1>{props.title.heading}</h1>
      </div>
      <div className="container area">
        <div className="row highlight-scroll">{event}</div>
      </div>
    </div>
  );
}

export default upcoming;
