import { useState, useEffect, useMemo } from 'react';
import { getSites } from '../utils/api';
import { SiteCardGrid } from '../components/Sites/SiteCardGrid';
import { FiltersBar } from '../components/Filters/FiltersBar';
import { SEOHead, pageSEO } from '../components/Common/SEOHead';
import type { SiteCard, Jurisdiction, SiteType } from '../types';

const buildAffiliateStructuredData = (sites: SiteCard[]) => {
  if (sites.length === 0) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'GambleCodez Affiliate Sites',
    itemListElement: sites.map((site, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: site.name,
      url: `https://gamblecodez.com/casino/${site.slug || site.id}`,
    })),
  };
};

export const Affiliates = () => {
  const [sites, setSites] = useState<SiteCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | 'ALL'>('ALL');
  const [selectedCategories, setSelectedCategories] = useState<SiteType[]>([]);

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      try {
        const params: {
          jurisdiction?: Jurisdiction;
          category?: string;
        } = {};
        if (selectedJurisdiction !== 'ALL') {
          params.jurisdiction = selectedJurisdiction;
        }
        if (selectedCategories.length > 0) {
          params.category = selectedCategories.join(',');
        }
        const response = await getSites(params);
        setSites(response.data);
      } catch (error) {
        console.error('Failed to fetch sites:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, [selectedJurisdiction, selectedCategories]);

  const handleCategoryToggle = (category: SiteType) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const structuredData = useMemo(() => buildAffiliateStructuredData(sites), [sites]);
  const visibleSites = sites.filter((site) => site.status !== 'blacklisted');

  return (
    <>
      <SEOHead {...pageSEO.affiliates} structuredData={structuredData} />
      <div className="min-h-screen pt-24 px-4 pb-12">
        <div className="container mx-auto">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 md:p-10 mb-10 relative overflow-hidden">
            <div className="absolute inset-0 hero-grid opacity-30" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neon-green mb-4">
                  Sweeps Directory
                </div>
                <h1 className="text-4xl md:text-5xl font-orbitron mb-4">
                  GambleCodez
                  <span className="text-neon-cyan"> site listings.</span>
                </h1>
                <p className="text-text-muted max-w-2xl">
                  Verified sweepstakes casinos, redemption notes, and bonus intel. Filter fast, claim faster.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#gcz-filters"
                  className="btn-neon px-5 py-3 rounded-2xl border border-white/20 text-white font-semibold hover:bg-white/5"
                >
                  Filter Listings
                </a>
                <a
                  href="https://t.me/GambleCodezDrops"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-neon px-5 py-3 rounded-2xl bg-neon-cyan text-bg-dark font-semibold shadow-glow-cyan"
                >
                  Get Drops
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-sheen rounded-2xl p-5 border border-white/10">
              <div className="text-sm text-text-muted mb-1">Listings Live</div>
              <div className="text-2xl font-semibold text-text-primary">{visibleSites.length}</div>
              <div className="text-xs text-text-muted">Updated daily from GCZ watchlist</div>
            </div>
            <div className="glass-sheen rounded-2xl p-5 border border-white/10">
              <div className="text-sm text-text-muted mb-1">Top Picks</div>
              <div className="text-2xl font-semibold text-neon-yellow">
                {visibleSites.filter((site) => site.is_top_pick).length}
              </div>
              <div className="text-xs text-text-muted">Fastest redemption + bonuses</div>
            </div>
            <div className="glass-sheen rounded-2xl p-5 border border-white/10">
              <div className="text-sm text-text-muted mb-1">New This Week</div>
              <div className="text-2xl font-semibold text-neon-pink">
                {visibleSites.filter((site) => new Date(site.date_added).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length}
              </div>
              <div className="text-xs text-text-muted">Fresh sweeps drops added</div>
            </div>
          </div>

          <FiltersBar
            selectedJurisdiction={selectedJurisdiction}
            selectedCategories={selectedCategories}
            onJurisdictionChange={setSelectedJurisdiction}
            onCategoryToggle={handleCategoryToggle}
          />

          <SiteCardGrid sites={visibleSites} loading={loading} />

          <div className="sr-only" aria-hidden="true">
            <ul>
              {visibleSites.map((site) => (
                <li key={site.id}>
                  <a href={`/casino/${site.slug || site.id}`}>{site.name}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};
