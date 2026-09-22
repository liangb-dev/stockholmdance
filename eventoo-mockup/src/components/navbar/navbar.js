import React, { useState } from "react";
import Button from "./registerbutton/navbtn";
import { CALENDAR_SUBSCRIBE_URL } from "../../site";

function Navbar(props) {
  const [open, setOpen] = useState(false);

  const navItem = props.name.map((item) => (
    <li key={item.id} className="nav-item">
      <a href={item.link} onClick={() => setOpen(false)}>
        {item.name}
      </a>
    </li>
  ));

  return (
    <nav className="navbar navbar-expand-lg" id="home">
      <div className="container">
        <a className="navbar-brand" href="#home">
          <img src={props.logo} alt="Stockholm Bachata & Salsa" />
        </a>
        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <i className="fa fa-bars" aria-hidden="true"></i>
        </button>

        <div
          className={`collapse navbar-collapse${open ? " show" : ""}`}
          id="navbarSupportedContent"
        >
          <ul className="navbar-nav ml-auto">
            {navItem}
            <a href={CALENDAR_SUBSCRIBE_URL}>
              <Button />
            </a>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
