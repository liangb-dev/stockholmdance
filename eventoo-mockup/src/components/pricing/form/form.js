import React from 'react'
import Selectplan from './selectplane/selectplan'
import Payment from '../../../assets/images/payment.png'

function form(props) {
  return (

    <form>
      <label className="heading">Giving your informations
      & Getting the Ticket</label>
      <input className="firstname ml" type="text" placeholder="your first name"/>
      <input className="firstname" type="text" placeholder="your first name"/>
      <input className="email ml" type="email" placeholder="your e-mail address "/>
      <input className="email" type="text" placeholder="your phone number"/>
      <Selectplan selectplan={props.selectplan}/>
      <div className="row mx-0">
        <div className="col-lg-6 col-md-6 text-lg-left text-center text-md-left p-0">
            <h2 className="payment">Select Payment Method</h2>
        </div>
        <div className="col-lg-6 p-0 col-md-6 text-center text-lg-right text-md-right">
            <img src={Payment}/>
        </div>
      </div>
      <input id="agree" type="checkbox"/>
      <label className="check" htmlFor="agree">I’ve read all this carefully and I agree with all agreements.</label>
      <button className="submit" type="submit">Get the Ticket</button>
    </form>

  )
}

export default form
