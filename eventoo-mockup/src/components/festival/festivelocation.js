import React from 'react'

function festivelocation(props) {

    
  return (

    <div className="loaction">
      <div className="address">
        <div className="add">
          <img src={props.location[0].locationimg} alt={props.location[0].locationimg} />
          <p>{props.location[0].text}</p>
        </div>
        <div className="add">
        <img className="addimg" src={props.location[1].addimg} alt={props.location[1].addimg} />
        <p className="no">{props.location[1].addtext}</p>
        </div>
      </div>
    </div>
  )
}

export default festivelocation
