import { useState, useEffect } from 'react';

interface PromoCode {
  id: string;
  site: string;
  code: string;
  description: string;
  expiresAt?: string;
  createdAt: string;
}

interface PromoLink {
  id: string;
  site: string;
  url: string;
  description: string;
  createdAt: string;
}

export const LiveDashboard = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promoLinks, setPromoLinks] = useState<PromoLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/live-dashboard?status=live');
        if (!response.ok) {
          throw new Error(`Live dashboard fetch failed (${response.status})`);
        }
        const data = await response.json();
        setPromoCodes(Array.isArray(data?.promoCodes) ? data.promoCodes : []);
        setPromoLinks(Array.isArray(data?.promoLinks) ? data.promoLinks : []);
      } catch (error) {
        console.error('Failed to fetch live promos:', error);
        setPromoCodes([]);
        setPromoLinks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Promo Codes Section */}
      <div>
        <h2 className="text-2xl font-bold text-neon-cyan mb-4">Live Promo Codes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promoCodes.map((promo) => (
            <div
              key={promo.id}
              className="bg-bg-dark-2 border-2 border-neon-pink/30 rounded-xl p-4 card-hover relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-neon-pink">{promo.site}</h3>
                <span className="text-xs text-text-muted">
                  {new Date(promo.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="mb-2">
                <div className="text-xs text-text-muted mb-1">Code:</div>
                <div className="font-mono text-lg font-bold text-neon-cyan">{promo.code}</div>
              </div>
              <p className="text-sm text-text-muted">{promo.description}</p>
              {promo.expiresAt && (
                <div className="mt-2 text-xs text-text-muted">
                  Expires: {new Date(promo.expiresAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Promo Links Section */}
      <div>
        <h2 className="text-2xl font-bold text-neon-green mb-4">Live Promo Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promoLinks.map((link) => (
            <div
              key={link.id}
              className="bg-bg-dark-2 border-2 border-neon-green/30 rounded-xl p-4 card-hover relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-neon-green">{link.site}</h3>
                <span className="text-xs text-text-muted">
                  {new Date(link.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-text-muted mb-3">{link.description}</p>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-neon-green hover:underline text-sm font-semibold transition-all duration-200 hover:gap-3"
              >
                Visit Link
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>

      {promoCodes.length === 0 && promoLinks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">No active promos at the moment</p>
        </div>
      )}
    </div>
  );
};
