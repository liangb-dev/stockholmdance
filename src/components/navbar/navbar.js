import React, { useEffect, useRef, useState } from "react";

function Navbar(props) {
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const navItem = props.name.map((item) => (
    <li key={item.id} className="nav-item">
      <a href={item.link} onClick={() => setOpen(false)}>
        {item.name}
      </a>
    </li>
  ));

  return (
    <>
      {open ? (
        <button
          type="button"
          className="navbar-backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <nav className="navbar navbar-expand-lg" id="home" ref={navRef}>
        <div className="container">
          <a className="navbar-brand" href="#home">
            <img src={props.logo} alt="Stockholm Bachata & Salsa" />
          </a>
          <button
            className="navbar-toggler"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
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
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
