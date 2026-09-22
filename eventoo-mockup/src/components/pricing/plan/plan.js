import React from 'react'
import Shape1 from"../../../assets/images/pricing-shape.png"
import Shape2 from"../../../assets/images/pricing-shape2.png"
import Shape3 from"../../../assets/images/pricing-shape3.png"
import Slider from "react-slick";

function plan(props) {
    const PrevArrow = props => (
        <button type="button" {...props}>
          <i className="fa fa-angle-up" aria-hidden="true"></i>
        </button>
    
      );
    
      const NextArrow = props => (
        <button type="button" {...props}>
          <i className="fa fa-angle-down" aria-hidden="true"></i>
        </button>
      );
      const settings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        prevArrow: <PrevArrow/>,
        nextArrow: <NextArrow/>,
        autoplay: true,
      };
  let plan = props
    .plan
    .map(item => {
        let list = item.facility.map(list=>{
            return(
                <li>{list}</li>
            )
        })

      return (

        <div key={item.id}  className="pricing-plane"  >
          <p >{item.name}</p>
          <h1 >{item.price}</h1>
          <ul>
            {list}
          </ul>
          <img  className="shape1" src={Shape1} alt={Shape1}/>
          <img className="shape2" src={Shape2} alt={Shape1}/>
          <img className="shape3" src={Shape3} alt={Shape1}/>
        </div>

      )
    })
  return (
    <div>
    <Slider {...settings}>

    {plan}
        </Slider>
      
    </div>
  )
}

export default plan
