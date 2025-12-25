import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Navigation from './components/Layout/Navigation';
import Home from './pages/Home';
import AllSites from './pages/AllSites';
import CategoryPage from './pages/CategoryPage';
import Blacklist from './pages/Blacklist';
import Newsletter from './pages/Newsletter';
import Raffles from './pages/Raffles';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import { SitesProvider } from './context/SitesContext';
import { UserProvider } from './context/UserContext';
import { AdsContext } from './context/AdsContext';
import PromoPopup from './components/Ads/PromoPopup';
import Toast from './components/UI/Toast';

export default function App() {
  const [toast, setToast] = useState(null);
  const [ads] = useState({ currentAd: null, showAd: false });

  return (
    <SitesProvider>
      <UserProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-black text-white flex flex-col">
            <Header />
            <Navigation />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/sites" element={<AllSites />} />
                <Route path="/:category" element={<CategoryPage />} />
                <Route path="/blacklist" element={<Blacklist />} />
                <Route path="/newsletter" element={<Newsletter />} />
                <Route path="/raffles" element={<Raffles />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            {ads.showAd && <PromoPopup />}
          </div>
        </BrowserRouter>
      </UserProvider>
    </SitesProvider>
  );
}
