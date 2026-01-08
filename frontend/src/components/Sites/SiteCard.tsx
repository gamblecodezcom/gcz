import { useState } from 'react';
import { CATEGORY_CONFIG, JURISDICTION_CONFIG } from '../../utils/constants';
import type { SiteCard as SiteCardType } from '../../types';

interface SiteCardProps {
  site: SiteCardType;
  onRedirect?: (slug: string) => void;
}

export const SiteCard = ({ site, onRedirect }: SiteCardProps) => {
  const [imageError, setImageError] = useState(false);
  const categories = site.category.split(',').map(c => c.trim()) as Array<keyof typeof CATEGORY_CONFIG>;
  const isNew = new Date(site.date_added).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
  const jurisdictionConfig = JURISDICTION_CONFIG[site.jurisdiction] || JURISDICTION_CONFIG.GLOBAL;

  const handleClick = () => {
    const redirectUrl = site.redirect_url || `/affiliates/redirect/${site.redirect_slug}`;
    if (onRedirect) {
      onRedirect(redirectUrl);
    } else {
      window.location.href = redirectUrl;
    }
  };

  return (
    <div
      className="group relative bg-bg-dark-2 border border-white/10 rounded-2xl p-6 card-hover cursor-pointer overflow-hidden transform transition-all duration-300"
      onClick={handleClick}
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/0 via-neon-pink/0 to-neon-yellow/0 group-hover:from-neon-cyan/8 group-hover:via-neon-pink/8 group-hover:to-neon-yellow/6 transition-all duration-500" />

      {/* Top Pick Badge */}
      {site.is_top_pick && (
        <div className="absolute top-2 right-2 z-10 animate-pulse">
          <span className="px-3 py-1 bg-gradient-to-r from-neon-yellow via-neon-gold to-neon-yellow text-bg-dark text-xs font-bold rounded-full shadow-neon-gold flex items-center gap-1">
            <span className="text-sm">👑</span>
            <span>TOP PICK</span>
          </span>
        </div>
      )}

      {/* NEW Badge */}
      {isNew && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-3 py-1 bg-gradient-to-r from-neon-pink to-neon-pink/80 text-white text-xs font-bold rounded-full shadow-neon-pink animate-pulse flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            <span>NEW</span>
          </span>
        </div>
      )}

      {/* Icon with enhanced styling */}
      <div className="flex justify-center mb-4 relative z-10">
        <div className="relative group/icon">
          {!imageError ? (
            <img
              src={site.icon_url}
              alt={site.name}
              className="w-20 h-20 object-contain rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 bg-white/5 p-2"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-bg-dark to-bg-dark-2 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
              🎰
            </div>
          )}
          <div className="absolute inset-0 rounded-2xl bg-neon-cyan/0 group-hover:bg-neon-cyan/20 transition-all duration-300 blur-sm -z-10" />
        </div>
      </div>

      {/* Name with gradient effect */}
      <h3 className="text-lg font-bold text-text-primary mb-2 text-center group-hover:text-neon-cyan transition-all duration-300 relative z-10">
        <span className="group-hover:neon-glow-cyan transition-all duration-300">{site.name}</span>
      </h3>

      {/* Categories with enhanced styling */}
      <div className="flex flex-wrap gap-2 justify-center mb-3 relative z-10">
        {categories.slice(0, 3).map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          if (!config) return null;
          return (
            <span
              key={cat}
              className={`px-2 py-1 text-xs rounded-full ${config.color} border border-current/30 transition-all duration-300 group-hover:scale-105 group-hover:border-current/60`}
            >
              {config.emblem} {cat}
            </span>
          );
        })}
        {categories.length > 3 && (
          <span className="px-2 py-1 text-xs rounded-full text-text-muted border border-text-muted/30 group-hover:border-text-muted/60 transition-all duration-300">
            +{categories.length - 3}
          </span>
        )}
      </div>

      {/* Jurisdiction Badge with animation */}
      <div className={`inline-block px-3 py-1 text-xs rounded-full mb-3 ${jurisdictionConfig.bg} border border-current/30 group-hover:scale-105 transition-all duration-300 relative z-10`}>
        {site.jurisdiction}
      </div>

      {/* Bonus Info with enhanced styling */}
      {site.bonus_code && (
        <div className="mb-2 relative z-10">
          <div className="text-xs text-text-muted mb-1">Bonus Code:</div>
          <div className="text-sm font-mono text-neon-cyan font-bold bg-neon-cyan/10 px-2 py-1 rounded-xl border border-neon-cyan/30 group-hover:bg-neon-cyan/20 transition-all duration-300">
            {site.bonus_code}
          </div>
        </div>
      )}

      {site.bonus_description && (
        <p className="text-xs text-text-muted mb-3 line-clamp-2 relative z-10 group-hover:text-text-primary transition-colors duration-300">
          {site.bonus_description}
        </p>
      )}

      {/* Redemption Info with icons */}
      <div className="text-xs text-text-muted space-y-1 relative z-10">
        {site.redemption_speed && (
          <div className="flex items-center gap-1">
            <span>⚡</span>
            <span>Speed: <span className="text-neon-green font-semibold">{site.redemption_speed}</span></span>
          </div>
        )}
        {site.redemption_minimum !== undefined && (
          <div className="flex items-center gap-1">
            <span>💰</span>
            <span>Min: <span className="text-neon-yellow font-semibold">${site.redemption_minimum}</span></span>
          </div>
        )}
      </div>

      {/* Enhanced Hover Glow Effect */}
      <div className="absolute inset-0 border-2 border-neon-cyan/0 group-hover:border-neon-cyan/50 rounded-2xl transition-all duration-500 pointer-events-none" />
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 shimmer" />
      </div>
    </div>
  );
};
