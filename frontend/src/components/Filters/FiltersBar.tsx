import type { Jurisdiction, SiteType } from '../../types';
import { CATEGORY_CONFIG } from '../../utils/constants';

interface FiltersBarProps {
  selectedJurisdiction?: Jurisdiction | 'ALL';
  selectedCategories: SiteType[];
  onJurisdictionChange: (jurisdiction: Jurisdiction | 'ALL') => void;
  onCategoryToggle: (category: SiteType) => void;
}

export const FiltersBar = ({
  selectedJurisdiction = 'ALL',
  selectedCategories,
  onJurisdictionChange,
  onCategoryToggle,
}: FiltersBarProps) => {
  const jurisdictions: Array<Jurisdiction | 'ALL'> = ['ALL', 'US', 'NON_US', 'GLOBAL'];
  const categories: SiteType[] = ['sweeps', 'crypto', 'lootbox', 'faucet', 'instant', 'kyc'];

  return (
    <div id="gcz-filters" className="bg-bg-dark-2 border border-neon-cyan/30 rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Jurisdiction Filter */}
        <div className="flex-1">
          <label className="block text-sm font-semibold text-neon-cyan mb-2">Jurisdiction</label>
          <div className="flex flex-wrap gap-2">
            {jurisdictions.map((jur) => {
              const isSelected = selectedJurisdiction === jur;
              return (
                <button
                  key={jur}
                  onClick={() => onJurisdictionChange(jur)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-neon-cyan text-bg-dark shadow-neon-cyan scale-105'
                      : 'bg-bg-dark text-text-muted hover:text-neon-cyan border border-neon-cyan/20 hover:border-neon-cyan/40 hover:scale-105'
                  }`}
                >
                  {jur}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex-1">
          <label className="block text-sm font-semibold text-neon-cyan mb-2">Categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              const config = CATEGORY_CONFIG[cat];
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryToggle(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                    isSelected
                      ? `${config.color} ${config.glow} border-2 border-current scale-105`
                      : 'bg-bg-dark text-text-muted hover:text-neon-cyan border border-neon-cyan/20 hover:border-neon-cyan/40 hover:scale-105'
                  }`}
                >
                  <span>{config.emblem}</span>
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
