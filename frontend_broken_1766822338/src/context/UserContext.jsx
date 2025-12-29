import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [lastCheckin, setLastCheckin] = useState(null);
  
  useEffect(() => {
    const subscribed = localStorage.getItem('gcz_subscribed') === 'true';
    setIsSubscribed(subscribed);
  }, []);
  
  return (
    <UserContext.Provider value={{ isSubscribed, setIsSubscribed, userEmail, setUserEmail, lastCheckin, setLastCheckin }}>
      {children}
    </UserContext.Provider>
  );
};
