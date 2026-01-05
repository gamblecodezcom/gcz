import { SiteCard } from './SiteCard';
import type { SiteCard as SiteCardType } from '../../types';

interface SiteCardGridProps {
  sites: SiteCardType[];
  onRedirect?: (slug: string) => void;
  loading?: boolean;
}

export const SiteCardGrid = ({ sites, onRedirect, loading }: SiteCardGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-bg-dark-2 border-2 border-neon-cyan/20 rounded-lg p-6 animate-pulse"
          >
            <div className="w-20 h-20 bg-bg-dark rounded-lg mx-auto mb-4" />
            <div className="h-4 bg-bg-dark rounded mb-2" />
            <div className="h-3 bg-bg-dark rounded w-2/3 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  const visibleSites = sites.filter((site) => site.status !== 'blacklisted');

  if (visibleSites.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-lg">No sites found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {visibleSites.map((site) => (
        <SiteCard key={site.id} site={site} onRedirect={onRedirect} />
      ))}
    </div>
  );
};
