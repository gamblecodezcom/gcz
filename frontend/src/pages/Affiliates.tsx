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
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-orbitron mb-4 neon-glow-cyan">
              All Sites
            </h1>
            <p className="text-text-muted">
              Curated sweeps, crypto, lootbox, and faucet sites.
            </p>
          </div>

          <a
            href="#gcz-filters"
            className="inline-block mb-4 text-neon-cyan hover:underline text-sm"
          >
            Jump to filters ↓
          </a>

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
