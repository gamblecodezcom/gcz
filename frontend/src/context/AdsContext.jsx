import React, { createContext, useState } from 'react';

export const AdsContext = createContext();

export const AdsProvider = ({ children }) => {
  const [currentAd] = useState(null);
  const [showAd] = useState(false);
  
  const dismissAd = () => {};
  
  return (
    <AdsContext.Provider value={{ currentAd, showAd, dismissAd }}>
      {children}
    </AdsContext.Provider>
  );
};
