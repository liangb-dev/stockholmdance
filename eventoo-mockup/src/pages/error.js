import React from 'react'
import Navbar from "../components/navbar/navbar";
import Banner from '../components/banner/banner';

import{navitem,image,bgimg,bannerText,bannerCountdown,videobtn} from '../components/variables/variable'
export default function error() {
    return (
        <section className="error-page">
        <Navbar name={navitem} logo={image}/>
        <Banner
        bg={bgimg}
        text={bannerText}
        countdown={bannerCountdown}
        videobtn={videobtn}/>
            
        </section>
    )
}
