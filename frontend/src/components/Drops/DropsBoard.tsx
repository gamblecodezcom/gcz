import { useState, useEffect } from 'react';
import { getDrops, reportDrop } from '../../utils/api';
import type { DropPromo } from '../../types';
import { RainbowFlash } from '../Animations/RainbowFlash';
import { Tooltip } from '../Common/Tooltip';
import { getCategoryColors } from '../../utils/categoryColors';

interface DropsBoardProps {
  jurisdiction?: string;
  casinoId?: string;
  featured?: boolean;
}

export const DropsBoard = ({ jurisdiction, casinoId, featured }: DropsBoardProps) => {
  const [promos, setPromos] = useState<DropPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | 'ALL'>(
    jurisdiction || 'ALL'
  );

  useEffect(() => {
    loadDrops();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDrops, 30000);
    return () => clearInterval(interval);
  }, [selectedJurisdiction, casinoId, featured]);

  const loadDrops = async () => {
    try {
      setLoading(true);
      const data = await getDrops({
        jurisdiction: selectedJurisdiction !== 'ALL' ? selectedJurisdiction : undefined,
        casino_id: casinoId,
        featured: featured,
        limit: 50
      });
      setPromos(data.promos);
    } catch (error) {
      console.error('Error loading drops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // You could show a toast notification here
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleReport = async (promoId: string, type: 'invalid_promo' | 'spam' | 'duplicate' | 'expired') => {
    if (!confirm('Report this promo?')) return;
    try {
      await reportDrop(promoId, { report_type: type });
      alert('Thank you for your report!');
    } catch (error) {
      console.error('Error reporting promo:', error);
    }
  };

  if (loading && promos.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-neon-cyan text-xl">Loading drops...</div>
      </div>
    );
  }

  if (promos.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-text-muted text-xl">No drops available at the moment.</div>
        <div className="text-text-muted mt-2">Check back soon for new promos!</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Jurisdiction Filter */}
      {!jurisdiction && (
        <div className="flex gap-2 mb-6 items-center flex-wrap">
          <button
            onClick={() => setSelectedJurisdiction('ALL')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              selectedJurisdiction === 'ALL'
                ? 'bg-neon-cyan text-bg-dark'
                : 'bg-bg-dark-2 border-2 border-neon-cyan/30 text-neon-cyan hover:border-neon-cyan'
            }`}
          >
            All
          </button>
          <Tooltip content="USA Daily: Promos available to players in the United States. These are typically sweeps casinos and US-licensed operators.">
            <button
              onClick={() => setSelectedJurisdiction('USA Daily')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                selectedJurisdiction === 'USA Daily'
                  ? 'bg-yellow-500 text-bg-dark'
                  : 'bg-bg-dark-2 border-2 border-yellow-500/30 text-yellow-500 hover:border-yellow-500'
              }`}
            >
              🇺🇸 USA Daily
            </button>
          </Tooltip>
          <Tooltip content="Crypto Daily: Promos for crypto casinos that accept cryptocurrency deposits. Available globally where crypto gambling is legal.">
            <button
              onClick={() => setSelectedJurisdiction('Crypto Daily')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                selectedJurisdiction === 'Crypto Daily'
                  ? 'bg-neon-yellow text-bg-dark'
                  : 'bg-bg-dark-2 border-2 border-neon-yellow/30 text-neon-yellow hover:border-neon-yellow'
              }`}
            >
              ₿ Crypto Daily
            </button>
          </Tooltip>
          <Tooltip content="Everywhere: Promos available to players worldwide, regardless of jurisdiction. These are typically global operators.">
            <button
              onClick={() => setSelectedJurisdiction('Everywhere')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                selectedJurisdiction === 'Everywhere'
                  ? 'bg-neon-green text-bg-dark'
                  : 'bg-bg-dark-2 border-2 border-neon-green/30 text-neon-green hover:border-neon-green'
              }`}
            >
              🌍 Everywhere
            </button>
          </Tooltip>
        </div>
      )}

      {/* Drops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promos.map((promo) => (
          <DropCard key={promo.id} promo={promo} onCopyCode={handleCopyCode} onReport={handleReport} />
        ))}
      </div>
    </div>
  );
};

interface DropCardProps {
  promo: DropPromo;
  onCopyCode: (code: string) => void;
  onReport: (id: string, type: 'invalid_promo' | 'spam' | 'duplicate' | 'expired') => void;
}

const DropCard = ({ promo, onCopyCode, onReport }: DropCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (promo.bonus_code) {
      onCopyCode(promo.bonus_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Determine category based on jurisdiction and promo type
  const getPromoCategory = (): string => {
    if (promo.jurisdiction_tags?.includes('USA Daily')) {
      return 'sweeps';
    }
    if (promo.jurisdiction_tags?.includes('Crypto Daily')) {
      return 'crypto';
    }
    // Default based on promo type
    if (promo.promo_type === 'code') return 'sweeps';
    if (promo.promo_type === 'url') return 'crypto';
    return 'sweeps';
  };

  const category = getPromoCategory();
  const categoryColors = getCategoryColors(category as any);

  const getJurisdictionBadge = (tag: string) => {
    const styles = {
      'USA Daily': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
      'Crypto Daily': 'bg-neon-yellow/20 text-neon-yellow border-neon-yellow/50',
      'Everywhere': 'bg-neon-green/20 text-neon-green border-neon-green/50',
    };
    return (
      <span
        key={tag}
        className={`px-2 py-1 rounded text-xs font-bold border ${styles[tag as keyof typeof styles] || 'bg-gray-500/20 text-gray-400'}`}
      >
        {tag}
      </span>
    );
  };

  return (
    <div
      className={`bg-bg-dark-2 border-2 rounded-xl p-6 card-hover relative overflow-hidden ${
        promo.featured
          ? `${categoryColors.border} ${categoryColors.glow}`
          : `${categoryColors.border} hover:${categoryColors.border.replace('/50', '')}`
      }`}
    >
      {promo.featured && (
        <div className="absolute top-2 right-2">
          <RainbowFlash>
            <span className="text-xs font-bold px-2 py-1 bg-neon-cyan/20 rounded">⭐ FEATURED</span>
          </RainbowFlash>
        </div>
      )}

      {/* Casino Logo/Name - Live Mapping */}
      <div className="flex items-center gap-3 mb-4">
        {promo.casino_logo ? (
          <img
            src={promo.casino_logo}
            alt={promo.casino_name || 'Casino'}
            className="w-12 h-12 rounded-lg object-contain bg-white/5 p-1"
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-bg-dark flex items-center justify-center">
            <span className="text-2xl">🎰</span>
          </div>
        )}
        <div className="flex-1">
          <div className={`font-bold ${categoryColors.text}`}>
            {promo.casino_name || 'Unknown Casino'}
          </div>
          {promo.resolved_domain && (
            <div className="text-xs text-text-muted flex items-center gap-1">
              <span>🌐</span>
              <span className="truncate max-w-[200px]" title={promo.resolved_domain}>
                {promo.resolved_domain}
              </span>
            </div>
          )}
          {promo.validity_flags?.verified && (
            <span className="text-xs text-neon-green flex items-center gap-1 mt-1">
              <span>✓</span>
              <span>Verified</span>
            </span>
          )}
        </div>
      </div>

      {/* Headline */}
      <h3 className={`text-xl font-bold mb-2 ${categoryColors.text} ${categoryColors.glow}`}>
        {promo.headline}
      </h3>

      {/* Description */}
      {promo.description && (
        <p className="text-text-muted mb-4 text-sm">{promo.description}</p>
      )}

      {/* Bonus Code */}
      {promo.bonus_code && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm text-text-muted">Bonus Code:</span>
            <code className={`bg-bg-dark px-3 py-1 rounded font-mono font-bold ${categoryColors.text} border ${categoryColors.border}`}>
              {promo.bonus_code}
            </code>
            <button
              onClick={handleCopy}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                copied
                  ? 'bg-neon-green text-bg-dark'
                  : `${categoryColors.bg} ${categoryColors.text} hover:opacity-80`
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Promo Type & Jurisdiction Tags */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {/* Promo Type Badge */}
        {promo.promo_type && (
          <span className={`px-2 py-1 rounded text-xs font-bold border ${categoryColors.border} ${categoryColors.bg} ${categoryColors.text}`}>
            {promo.promo_type === 'code' && '🎟️ Code'}
            {promo.promo_type === 'url' && '🔗 Link'}
            {promo.promo_type === 'hybrid' && '🎯 Code + Link'}
            {promo.promo_type === 'info_only' && 'ℹ️ Info'}
          </span>
        )}
        {/* Jurisdiction Tags */}
        {promo.jurisdiction_tags && promo.jurisdiction_tags.length > 0 && (
          <>
            {promo.jurisdiction_tags.map((tag) => getJurisdictionBadge(tag))}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        {promo.promo_url && (
          <a
            href={promo.promo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-neon-pink text-white font-bold rounded-lg hover:bg-neon-pink/80 transition-all text-center"
          >
            🔗 Promo Link
          </a>
        )}
        {promo.quick_signup_url && (
          <a
            href={promo.quick_signup_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-neon-green text-bg-dark font-bold rounded-lg hover:bg-neon-green/80 transition-all text-center"
          >
            ⚡ Quick Signup
          </a>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mt-4 text-xs">
        {promo.validity_flags?.community_submitted && (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">👥 Community</span>
        )}
        {promo.validity_flags?.admin_edited && (
          <span className="px-2 py-1 bg-neon-pink/20 text-neon-pink rounded">✏️ Admin Edited</span>
        )}
        {new Date(promo.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) && (
          <span className="px-2 py-1 bg-neon-green/20 text-neon-green rounded">🆕 New</span>
        )}
      </div>

      {/* Report Button (small, subtle) */}
      <div className="mt-3 text-right">
        <button
          onClick={() => onReport(promo.id, 'invalid_promo')}
          className="text-xs text-text-muted hover:text-red-400 transition-colors"
        >
          Report Issue
        </button>
      </div>
    </div>
  );
};
