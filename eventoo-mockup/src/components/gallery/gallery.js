import React from "react";
import Slider from "react-slick";

function gallery(props) {
  const img = props.img.map((item) => (
    <div className="img" key={item.id}>
      <img src={item.img} alt="" />
      <div className="overlay">
        <a href={item.img} target="_blank" rel="noreferrer">
          +
        </a>
      </div>
    </div>
  ));

  const settings = {
    dots: false,
    arrows: false,
    infinite: true,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
    responsive: [
      {
        breakpoint: 991,
        settings: { slidesToShow: 3, slidesToScroll: 1, infinite: true },
      },
      {
        breakpoint: 767.98,
        settings: { slidesToShow: 2, slidesToScroll: 1 },
      },
    ],
  };

  return (
    <div className="gallery-part">
      <div className="title text-center">
        <p>{props.title.subheading}</p>
        <h1>{props.title.heading}</h1>
      </div>
      <Slider {...settings}>{img}</Slider>
    </div>
  );
}

export default gallery;
