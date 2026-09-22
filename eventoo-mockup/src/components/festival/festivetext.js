import React from 'react'




function festivetext(props) {
    let textlength = props.text.details;
    return (
        <div>
            <h1 className="text-title">{props.text.heading}</h1>
            <p className="para1">{textlength.slice(0,233)}</p>
            <p className="para2">{textlength.slice(233)}</p>
        </div>
    )
}



export default festivetext;

