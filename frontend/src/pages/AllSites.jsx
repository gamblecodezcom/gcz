import React, { useContext, useEffect, useState } from 'react';
import { SitesContext } from '../context/SitesContext';

export default function AllSites() {
  const { sites, loading, fetchSites, currentPage, setCurrentPage, totalPages, sortBy, setSortBy } = useContext(SitesContext);
  
  useEffect(() => {
    fetchSites(null, currentPage);
  }, [currentPage, sortBy]);
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400">All Casino Sites</h1>
      
      <div className="mb-6 flex gap-4">
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
        >
          <option value="priority">Priority</option>
          <option value="top_pick">Top Picks</option>
          <option value="newest">Newest First</option>
        </select>
      </div>
      
      {loading ? (
        <div className="text-center py-12"><p className="text-gray-400">Loading sites...</p></div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {sites.map(site => (
              <div key={site.id} className="bg-gray-950 border border-gray-800 rounded-lg p-6 hover:shadow-lg hover:shadow-cyan-500/50 transition-all">
                <h3 className="text-xl font-bold text-cyan-400 mb-2">{site.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{site.description}</p>
                <button className="w-full px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded hover:shadow-lg">
                  Visit Site →
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded ${page === currentPage ? 'bg-cyan-400 text-black' : 'bg-gray-900 border border-gray-700 text-cyan-400'}`}
              >
                {page}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
