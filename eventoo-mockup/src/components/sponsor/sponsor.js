import React from 'react'

function sponsor(props) {
  let img = props.sponsor.map(function(item){
        return(
            <img key={item.id} src={item.img} alt={item.img}/>
        )
  })
  return (
    <div className="sponsor-part">
      <div className="title text-center">
        <p>{props.title.subheading}</p>
        <h1>{props.title.heading}</h1>
      </div>
      <div className="container">
           <div className="img">
           {img}
           </div>
      </div>
    </div>
  )
}

export default sponsor
