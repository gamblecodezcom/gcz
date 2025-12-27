// frontend/src/components/Header.jsx
import React from "react";
import { Link } from "react-router-dom";

const Header = () => (
  <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
    <h1 className="text-2xl font-bold">GambleCodez</h1>
    <nav className="flex gap-6 text-lg">
      <Link to="/" className="hover:text-cyan-400">Home</Link>
      <Link to="/daily-spin" className="hover:text-cyan-400">Daily Spin</Link>
      <Link to="/raffles" className="hover:text-cyan-400">Raffles</Link>
    </nav>
  </header>
);

export default Header;