import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => (
  <header className="header">
    <div className="logo">
      <Link to="/">🎰 GambleCodez</Link>
    </div>
    <nav className="nav">
      <Link to="/raffles">Raffles</Link>
      <Link to="/spin">Daily Spin</Link>
      <Link to="/admin">Admin</Link>
    </nav>
  </header>
);

export default Header;