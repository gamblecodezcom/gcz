import React, { createContext, useState, useCallback } from 'react';
import { apiClient } from '../utils/api';

export const SitesContext = createContext();

export const SitesProvider = ({ children }) => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('priority');
  
  const fetchSites = useCallback(async (category = null, page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort: sortBy };
      if (category) params.category = category;
      
      const data = await apiClient.getSites(params);
      setSites(data.sites || []);
      setCurrentPage(data.current_page || 1);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);
  
  return (
    <SitesContext.Provider
      value={{ sites, loading, error, currentPage, totalPages, sortBy, setSortBy, fetchSites, setCurrentPage }}
    >
      {children}
    </SitesContext.Provider>
  );
};
