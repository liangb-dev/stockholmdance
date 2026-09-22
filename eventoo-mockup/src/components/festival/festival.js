import React from 'react'
import Slider from "react-slick";
import Festivetext from './festivetext';
import Festivelocation from './festivelocation';
function festival(props) {
  const festiveSlider = {
    arrows: false,
    dots: true,
    infinite: false,
    speed: 300,
    slidesToShow: 1,
    slidesToScroll: 1,
    infinite: true,
    centerMode: true,
    centerPadding: 0,
    autoplay: true,
    responsive: [
      {
        breakpoint: 991,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: true
        }
      }, {
        breakpoint: 767,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }, {
        breakpoint: 575.98,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  }

  let Img = props
    .img
    .map(img => {
      return (<img key={img.id} src={img.img} alt={img.img}/>)
    })
let arr = Array.from(props.year[0].year)
    
  return (
    <div className="festive-part">
      <div className="container p-0">
        <div className="row mx-0">
          <div className="col-lg-5">
            <Slider {...festiveSlider}>
              {Img}

            </Slider>
          </div>

          <div className="col-lg-7 p-0">
            <div className="festive-left">
              <div className="text-img">
                <h1>{arr[0]}{arr[1]}</h1>
                <h1>{arr[2]}{arr[3]}</h1>
                <p>{props.year[1].day}</p>
              </div>
              <div className="text">
                <Festivetext text={props.text}/>
                <Festivelocation  location={props.location}/>
              </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default festival
