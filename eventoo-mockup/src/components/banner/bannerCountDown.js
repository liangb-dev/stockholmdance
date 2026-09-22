import React, { useEffect, useState } from "react";

function pad(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function remaining(target) {
  const distance = target - Date.now();
  if (distance <= 0) {
    return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  }

  return {
    days: pad(Math.floor(distance / (1000 * 60 * 60 * 24))),
    hours: pad(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
    minutes: pad(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))),
    seconds: pad(Math.floor((distance % (1000 * 60)) / 1000)),
  };
}

function CountDown(props) {
  const target = new Date(props.count.date).getTime();
  const [time, setTime] = useState(() => remaining(target));

  useEffect(() => {
    const id = window.setInterval(() => setTime(remaining(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return (
    <div className="counterdown">
      <div className="day">
        <p id="day">{time.days}</p>
        <span>Days</span>
      </div>
      <div className="hour">
        <p id="hour">{time.hours}</p>
        <span>Hours</span>
      </div>
      <div className="min">
        <p id="min">{time.minutes}</p>
        <span>Minutes</span>
      </div>
      <div className="sec">
        <p id="sec">{time.seconds}</p>
        <span>Seconds</span>
      </div>
    </div>
  );
}

export default CountDown;
