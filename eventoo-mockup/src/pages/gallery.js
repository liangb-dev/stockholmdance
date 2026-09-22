import React from 'react'
import Navbar from '../components/navbar/navbar';
import Sponsor from '../components/sponsor/sponsor';
import Footer from '../components/footer/footer';
import {navitem, image, aboutbgimg,galleryImg,sponsorTitle,sponsorimg,footerbg} from '../components/variables/variable'

function about() {
    let img = galleryImg.map(item=>{
        return(
            <div  className="img" key={item.id}>
                <img src={item.img} alt={item.img}/>
                <div className="overlay">
                <a className="venobox" data-gall="gallery01" href={item.img}>
                    +
                </a>
                </div>
            </div>
        )
    })
  return (
    <section className="about-page">
      <Navbar name={navitem} logo={image}/>
      <nav aria-label="breadcrumb" style={aboutbgimg}>
        <div className="overlay">
        <h1>Event Gallery</h1>
      <ol className="breadcrumb">
        <li className="breadcrumb-item"><a href="#">Home</a></li>
        <li className="breadcrumb-item active"><a href="#"><i className="fa fa-circle" aria-hidden="true"></i>Gallery</a></li>
      </ol>
        </div>
      </nav>

      <div className="event">
      {img}
      </div>

      <Sponsor title={sponsorTitle} sponsor={sponsorimg}/>
        <Footer bg={footerbg}/>
      
    </section>
  )
}

export default about;
