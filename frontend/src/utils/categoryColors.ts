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

/**
 * Master category → color map
 */
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
 * Normalize category strings into valid keys
 * Handles:
 *  - uppercase
 *  - spaces
 *  - hyphens
 *  - commas
 *  - multi-category strings
 */
export function normalizeCategory(input: string): CategoryType | null {
  if (!input) return null;

  const cleaned = input
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')
    .trim();

  if (cleaned in categoryColorMap) {
    return cleaned as CategoryType;
  }

  return null;
}

/**
 * Get color config for a single category
 */
export function getCategoryColors(category: string): CategoryColorConfig {
  const normalized = normalizeCategory(category);
  return normalized
    ? categoryColorMap[normalized]
    : categoryColorMap.sweeps; // fallback
}

/**
 * Get merged classes for a category or multi-category string
 * Example:
 *   "crypto, instant" → merges both styles
 */
export function getCategoryClasses(category: string): string {
  const parts = category.split(',').map(c => c.trim());

  const configs = parts
    .map(getCategoryColors)
    .filter(Boolean);

  // Merge all className + border/bg/text
  const merged = new Set<string>();

  configs.forEach(cfg => {
    merged.add(cfg.border);
    merged.add(cfg.bg);
    merged.add(cfg.text);
    merged.add(cfg.className);
  });

  return Array.from(merged).join(' ');
}
