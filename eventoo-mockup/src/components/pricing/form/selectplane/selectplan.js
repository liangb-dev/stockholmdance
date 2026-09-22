import React from 'react'

function selectplan(props) {
    let plan = props.selectplan.map(plan=>{
        return(
            <option key={plan.id} value={plan.id}>{plan.plan}</option>
        )
    })
    return (
        <select>
            <option>select a plan</option>
            
            {plan}
        </select>
    )
}



export default selectplan

