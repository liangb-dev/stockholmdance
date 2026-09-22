import React from 'react'
import Slider from "react-slick";
function event(props) {

  const PrevArrow = props => (
    <button type="button" {...props}>
      <i className="fa fa-angle-left" aria-hidden="true"></i>
    </button>

  );

  const NextArrow = props => (
    <button type="button" {...props}>
      <i className="fa fa-angle-right" aria-hidden="true"></i>
    </button>
  );
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    prevArrow: <PrevArrow/>,
    nextArrow: <NextArrow/>,
    responsive: [
      {
        breakpoint: 991,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: false
        }
      }, {
        breakpoint: 767.98,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }, {
        breakpoint: 575.98,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows:false,
        }
      }
    ]
   
  };
  let feedback = props
    .feedback
    .map(item => {
      return (
        <div key={item.id} className="feedback">
          <p className="details">{item.details}</p>
          <div className="img">
            <img src={item.img} alt={item.img}/>
            <div className="icon">
              <i className={item.icon} aria-hidden="true"></i>
              <i className={item.icon} aria-hidden="true"></i>
              <i className={item.icon} aria-hidden="true"></i>
              <i className={item.icon} aria-hidden="true"></i>
              <i className={item.icon} aria-hidden="true"></i>
            </div>
          </div>
          <h2>{item.name}</h2>
          <p className="designation">{item.designation}</p>
        </div>

      )
    })

  return (
    <div className="feedback-part">
    <div className="title text-center">
        <p>{props.title.subheading}</p>
        <h1>{props.title.heading}</h1>
    </div>

      <div className="container">
        <Slider {...settings}>

          {feedback}
        </Slider>

      </div>
    </div>
  )
}

export default event
