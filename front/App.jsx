// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import DailySpin from "./pages/DailySpin";
import Raffles from "./pages/Raffles";

function App() {
  return (
    <Router>
      <Header />
      <main className="min-h-screen bg-black text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/daily-spin" element={<DailySpin />} />
          <Route path="/raffles" element={<Raffles />} />
          <Route path="*" element={<div className="p-10 text-center text-xl">404 - Not Found</div>} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;