import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <p>&copy; {new Date().getFullYear()} GambleCodez. All rights reserved.</p>
  </footer>
);

export default Footer;