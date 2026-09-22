import React from 'react'

function upcominglocation(props) {
    
    return (
        <div className="location">
            <div className="address">
            
                <div className="img immg">
                        <img src={props.locationimg}/>
                </div>
                <div className="details">
                 <p>{props.address}</p>
                </div>
            </div>
            <div className="address shape">
                <div className="img immg">
                    <img src={props.phoneimg} alt={props.phoneimg}/>
                </div>
                <div className="details number">
                <p>{props.number}</p>
                </div>
            </div>
        </div>
    )
}



export default upcominglocation;

