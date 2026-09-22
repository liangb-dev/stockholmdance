import React from 'react'
import Navbar from "../components/navbar/navbar";
import Shape1 from "../assets/images/pricing-shape.png"
import Shape2 from "../assets/images/pricing-shape2.png"
import Shape3 from "../assets/images/pricing-shape3.png"
import Sponsor from '../components/sponsor/sponsor'
import Footer from '../components/footer/footer'
import Form from '../components/pricing/form/form'
import {navitem, image, pricingPlane, aboutbgimg, selectplan,sponsorTitle,sponsorimg,footerbg} from '../components/variables/variable'
function pricing_plane(props) {

  let plan = pricingPlane.map(item => {
    let list = item
      .facility
      .map((list, index) => {
        return (
          <li key={index}>{list}</li>
        )
      })

    return (

      <div className="pricing-plane">
        <p >{item.name}</p>
        <h1 >{item.price}</h1>
        <ul>
          {list}
        </ul>
        <img className="shape1" src={Shape1}/>
        <img className="shape2" src={Shape2}/>
        <img className="shape3" src={Shape3}/>
      </div>

    )
  })

  let planitem = plan.map((item, index) => {

    return (
      <div key={index} className="col-lg-4 col-md-4">
        {item}
      </div>

    )
  })
  return (

    <section className="prcing-page">
      <Navbar name={navitem} logo={image}/>
      <nav aria-label="breadcrumb" style={aboutbgimg}>
        <div className="overlay">
          <h1>Pricing Plan</h1>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="#">Home</a>
            </li>
            <li className="breadcrumb-item active">
              <a href="#">
                <i className="fa fa-circle" aria-hidden="true"></i>Pricing Plan</a>
            </li>
          </ol>
        </div>
      </nav>
      <div className="pricing">
        <div className="container">
          <div className="row">
            {planitem}
          </div>
        </div>
      </div>
      <div className="container">
    
      <Form  selectplan={selectplan}/>
  
      </div>
      <Sponsor title={sponsorTitle} sponsor={sponsorimg}/>
        <Footer bg={footerbg}/>
    </section>
  )
}

export default pricing_plane;