import React from 'react'
import Plane from './plan/plan'
import Form from './form/form'

function pricing(props) {
    
    return (
        <div className="pricing-part">
            <div className="title text-center">
                <p>{props.title.subheading}</p>
                <h1>{props.title.heading}</h1>
            </div>
            <div className="container">
                <div className="row">
                    <div className="col-lg-4 col-md-6">
                        <Plane plan={props.plan}/>
                    
                    </div>
                    <div className="col-lg-7 col-md-6 offset-0 offset-lg-1">
                        <Form selectplan={props.selectplan}/>
                    </div>
                </div>
            </div>
        </div>
    )
}


export default pricing

