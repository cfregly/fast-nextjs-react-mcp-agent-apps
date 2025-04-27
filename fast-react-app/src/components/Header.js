import React from 'react';

import './Header.css';
import logo from './ascii-logo.jpg';

const Header = ({ logoText }) => {
  return (
    <header className="header">
      <div className="logo">
        <img src={logo} alt="Logo" className="logo-image" />
        <h1 className="logo-text">{logoText}</h1>
      </div>
      <nav className="nav">
        <ul>
          <li><a href="/" className="nav-link">Draw ASCII Art</a></li>
          <li><a href="/get-weather" className="nav-link">Get Weather</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;