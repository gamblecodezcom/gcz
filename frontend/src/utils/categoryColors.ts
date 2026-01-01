/**
 * Category color mapping for GambleCodez design system
 */
export type CategoryType = 
  | 'sweeps' 
  | 'crypto' 
  | 'lootbox' 
  | 'faucet' 
  | 'instant' 
  | 'kyc' 
  | 'top_pick';

export interface CategoryColorConfig {
  border: string;
  bg: string;
  text: string;
  glow: string;
  className: string;
}

export const categoryColorMap: Record<CategoryType, CategoryColorConfig> = {
  sweeps: {
    border: 'border-neon-cyan/50',
    bg: 'bg-neon-cyan/10',
    text: 'text-neon-cyan',
    glow: 'shadow-neon-cyan',
    className: 'category-sweeps'
  },
  crypto: {
    border: 'border-neon-yellow/50',
    bg: 'bg-neon-yellow/10',
    text: 'text-neon-yellow',
    glow: 'shadow-neon-yellow',
    className: 'category-crypto'
  },
  lootbox: {
    border: 'border-neon-pink/50',
    bg: 'bg-neon-pink/10',
    text: 'text-neon-pink',
    glow: 'shadow-neon-pink',
    className: 'category-lootbox'
  },
  faucet: {
    border: 'border-neon-green/50',
    bg: 'bg-neon-green/10',
    text: 'text-neon-green',
    glow: 'shadow-neon-green',
    className: 'category-faucet'
  },
  instant: {
    border: 'border-neon-cyan/50',
    bg: 'bg-neon-cyan/10',
    text: 'text-neon-cyan',
    glow: 'shadow-neon-cyan',
    className: 'category-instant'
  },
  kyc: {
    border: 'border-orange-500/50',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    glow: 'shadow-orange-500',
    className: 'category-kyc'
  },
  top_pick: {
    border: 'border-yellow-500/50',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500',
    className: 'category-top_pick'
  }
};

/**
 * Get category color configuration
 */
export function getCategoryColors(category: CategoryType | string): CategoryColorConfig {
  const normalized = category.toLowerCase().replace(/\s+/g, '_') as CategoryType;
  return categoryColorMap[normalized] || categoryColorMap.sweeps;
}

/**
 * Get category class names for styling
 */
export function getCategoryClasses(category: CategoryType | string): string {
  const config = getCategoryColors(category);
  return `${config.border} ${config.bg} ${config.text} ${config.className}`;
}
