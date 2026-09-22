import React from 'react'
import Navbar from "../components/navbar/navbar";
import Sponsor from '../components/sponsor/sponsor'
import Footer from '../components/footer/footer'
import{navitem,image,aboutbgimg,sponsorTitle,sponsorimg,footerbg,sponsorname} from '../components/variables/variable'
function sponsor() {

    let sponsornam = sponsorname.map(item=>{
        return(
            <div key={item.id}  className="col-lg-6 col-md-6">
                <h1 ><span>{item.level}</span>{item.title}</h1>
                <img  src={item.img} alt={item.img}/>
            </div>
        )
    })


    return (
        <section className="sponsor-page">
        <Navbar name={navitem} logo={image}/>
        <nav aria-label="breadcrumb" style={aboutbgimg}>
        <div className="overlay">
          <h1>Sponsors</h1>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="#">Home</a>
            </li>
            <li className="breadcrumb-item active">
              <a href="#">
                <i className="fa fa-circle" aria-hidden="true"></i>Sponsors</a>
            </li>
          </ol>
        </div>
      </nav>

      <div className="sponsor">
            <div className="container">
            <div className="sponsorname">
            <div className="row">
                    {sponsornam}
                </div>
            </div>
                
            </div>
      </div>
        <Sponsor title={sponsorTitle} sponsor={sponsorimg}/>
               <Footer bg={footerbg}/>
        </section>
    )
}

export default sponsor;
