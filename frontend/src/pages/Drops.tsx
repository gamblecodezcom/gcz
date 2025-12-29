import { useState, useEffect } from 'react';
import { getSites } from '../utils/api';
import { SiteCardGrid } from '../components/Sites/SiteCardGrid';
import { FiltersBar } from '../components/Filters/FiltersBar';
import { LiveDashboard } from '../components/Dashboard/LiveDashboard';
import type { SiteCard, Jurisdiction, SiteType } from '../types';

export const Drops = () => {
  const [sites, setSites] = useState<SiteCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | 'ALL'>('ALL');
  const [selectedCategories, setSelectedCategories] = useState<SiteType[]>([]);

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      try {
        const params: any = {};
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

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-orbitron mb-4 neon-glow-cyan">
            Promo Code Drops & Links
          </h1>
          <p className="text-text-muted">
            Live interactive dashboard for incoming promo codes and promo links
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

        <div className="mb-12">
          <LiveDashboard />
        </div>

        <SiteCardGrid sites={sites} loading={loading} />
      </div>
    </div>
  );
};
