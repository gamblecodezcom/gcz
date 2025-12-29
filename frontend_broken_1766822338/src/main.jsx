import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Raffles from './pages/Raffles';
import DailySpin from './pages/DailySpin';
import Admin from './pages/Admin';
import './styles/global.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/raffles" element={<Raffles />} />
      <Route path="/spin" element={<DailySpin />} />
      <Route path="/admin/*" element={<Admin />} />
    </Routes>
  </BrowserRouter>
);