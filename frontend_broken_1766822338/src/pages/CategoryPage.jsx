import React, { useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SitesContext } from '../context/SitesContext';

export default function CategoryPage() {
  const { category } = useParams();
  const { sites, loading, fetchSites } = useContext(SitesContext);
  
  useEffect(() => {
    fetchSites(category, 1);
  }, [category]);
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400 capitalize">{category} Sites</h1>
      {loading ? <p>Loading...</p> : <p className="text-gray-400">{sites.length} sites found</p>}
    </div>
  );
}
