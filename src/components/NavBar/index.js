import React from "react";
import PropTypes from "prop-types";
import { Navbar, Nav } from "react-bootstrap";
import './style.sass';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

export const NavBar = ({ logo, links = [], logoStyle }) => {
  return (
    <div className="nav-bar-component">
      <Navbar className="nav-bar-custom" expand="lg">
        <div className="logo-container" style={logoStyle}>
          <a href="/">
            <img className="logo" src={logo} alt="logo" />
          </a>
        </div>
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="toggle" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="justify-content-end" style={{ width: "100%" }}>
            {links.map((link) => link.isExternal ? (
              <Nav.Link
                key={link.path}
                href={link.path}
                target="_blank"
                className={link.isSpecial ? "special" : ""}
              >
                {link.name} <FontAwesomeIcon icon={faExternalLinkAlt} className="nav-icon" />
              </Nav.Link>
            ) : (
              <Nav.Link
                key={link.path}
                to={link.path}
                className={link.isSpecial ? "special" : ""}
                style={{ backgroundColor: null }}
              >
                {link.name}
              </Nav.Link>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </div>
  );
};

NavBar.propTypes = {
  logo: PropTypes.string,
  links: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      isExternal: PropTypes.bool,
      isSpecial: PropTypes.bool
    })
  ),
  logoStyle: PropTypes.object
};
