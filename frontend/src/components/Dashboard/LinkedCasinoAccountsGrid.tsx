import { useState, useEffect } from 'react';
import { getSites, getLinkedSites, linkSite, unlinkSite } from '../../utils/api';
import { CATEGORY_CONFIG, JURISDICTION_CONFIG } from '../../utils/constants';
import type { SiteCard, LinkedSite } from '../../types';

interface LinkedCasinoAccountsGridProps {
  isPinUnlocked: boolean;
  onPinRequired: () => void;
  onLinkSuccess: () => void;
}

export const LinkedCasinoAccountsGrid = ({
  isPinUnlocked,
  onPinRequired,
  onLinkSuccess,
}: LinkedCasinoAccountsGridProps) => {
  const [sites, setSites] = useState<SiteCard[]>([]);
  const [linkedSites, setLinkedSites] = useState<LinkedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<SiteCard | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [identifierType, setIdentifierType] = useState<'username' | 'email' | 'player_id'>('username');
  const [identifierValue, setIdentifierValue] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesData, linkedData] = await Promise.all([
          getSites({ limit: 1000 }),
          getLinkedSites(),
        ]);
        setSites(sitesData.data);
        setLinkedSites(linkedData);
      } catch (error) {
        console.error('Failed to fetch sites:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getLinkedSite = (siteId: string): LinkedSite | undefined => {
    return linkedSites.find((ls) => ls.siteId === siteId);
  };

  // Normalized casino detection - uses slug or name fallback, case-insensitive
  const getNormalizedSlug = (site: SiteCard): string => {
    return (site.slug?.toLowerCase() || site.name?.toLowerCase() || '').trim();
  };

  // Normalized casino detection functions
  const isRunewager = (site: SiteCard): boolean => {
    const slug = getNormalizedSlug(site);
    return slug === 'runewager' || slug.includes('runewager');
  };

  const isStakeCom = (site: SiteCard): boolean => {
    const slug = getNormalizedSlug(site);
    return slug === 'stake.com' || slug === 'stake';
  };

  const isStakeUs = (site: SiteCard): boolean => {
    const slug = getNormalizedSlug(site);
    return slug === 'stake.us';
  };

  const isGoated = (site: SiteCard): boolean => {
    const slug = getNormalizedSlug(site);
    return slug === 'goated';
  };

  const isRoobet = (site: SiteCard): boolean => {
    const slug = getNormalizedSlug(site);
    return slug === 'roobet';
  };

  const isWinna = (site: SiteCard): boolean => {
    const slug = getNormalizedSlug(site);
    return slug === 'winna';
  };

  const isShuffleCom = (site: SiteCard): boolean => {
    const slug = getNormalizedSlug(site);
    return slug === 'shuffle.com' || slug === 'shuffle';
  };

  const isShuffleUs = (site: SiteCard): boolean => {
    const slug = getNormalizedSlug(site);
    return slug === 'shuffle.us';
  };

  const isCwallet = (site: SiteCard): boolean => {
    const slug = getNormalizedSlug(site);
    return slug === 'cwallet';
  };

  // Tip eligibility logic using normalized slugs
  // Returns: true (eligible), "rare" (rarely eligible), false (not eligible)
  const getTipEligibility = (site: SiteCard, linked: LinkedSite | undefined): { tipEligible: boolean | 'rare'; label: string } => {
    if (!linked) {
      return { tipEligible: false, label: 'Not Tip Eligible' };
    }

    // Always eligible: Runewager, Winna, Cwallet
    if (isRunewager(site) || isWinna(site) || isCwallet(site)) {
      return { tipEligible: true, label: 'Tip Eligible' };
    }

    // Rarely eligible: Stake.com, Goated, Roobet, Shuffle.com
    if (isStakeCom(site) || isGoated(site) || isRoobet(site) || isShuffleCom(site)) {
      return { tipEligible: 'rare', label: 'Rarely Tip Eligible' };
    }

    // Not eligible: Stake.us, Shuffle.us, and all unknown sites
    if (isStakeUs(site) || isShuffleUs(site)) {
      return { tipEligible: false, label: 'Not Tip Eligible' };
    }

    // Fallback for unknown sites
    return { tipEligible: false, label: 'Not Tip Eligible' };
  };

  const handleCardClick = (site: SiteCard) => {
    if (!isPinUnlocked) {
      onPinRequired();
      return;
    }
    setSelectedSite(site);
    const existing = getLinkedSite(site.id);
    if (existing) {
      setIdentifierType(existing.identifierType);
      setIdentifierValue(existing.identifierValue);
    } else {
      setIdentifierType('username');
      setIdentifierValue('');
    }
    setShowLinkModal(true);
    setLinkError('');
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite || !identifierValue.trim()) return;

    if (!isPinUnlocked) {
      onPinRequired();
      return;
    }

    setLinking(true);
    setLinkError('');

    try {
      await linkSite({
        siteId: selectedSite.id,
        identifierType,
        identifierValue: identifierValue.trim(),
      });
      // Refresh linked sites
      const updated = await getLinkedSites();
      setLinkedSites(updated);
      
      // Trigger border surge animation on the linked card
      const cardElement = document.querySelector(`[data-site-id="${selectedSite.id}"]`);
      if (cardElement) {
        cardElement.classList.add('border-surge-green');
        setTimeout(() => {
          cardElement.classList.remove('border-surge-green');
        }, 1000);
      }
      
      setShowLinkModal(false);
      setSelectedSite(null);
      setIdentifierValue('');
      onLinkSuccess();
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : 'Failed to link account');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (siteId: string) => {
    if (!isPinUnlocked) {
      onPinRequired();
      return;
    }

    if (!confirm('Are you sure you want to unlink this account?')) return;

    try {
      await unlinkSite(siteId);
      const updated = await getLinkedSites();
      setLinkedSites(updated);
      onLinkSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to unlink account');
    }
  };

  const handleRedirect = (site: SiteCard) => {
    const redirectUrl = site.redirect_url || `/affiliates/redirect/${site.redirect_slug}`;
    window.location.href = redirectUrl;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  // Filter to only show active sites
  const activeSites = sites.filter((s) => s.status === 'active');

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 neon-glow-cyan">Linked Casino Accounts</h2>
        <p className="text-text-muted mb-4">
          Link your casino accounts to track your activity and receive rewards
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {activeSites.map((site) => {
          const linked = getLinkedSite(site.id);
          const categories = site.category.split(',').map((c) => c.trim());
          const jurisdictionConfig = JURISDICTION_CONFIG[site.jurisdiction] || JURISDICTION_CONFIG.GLOBAL;
          const tipEligibility = getTipEligibility(site, linked);
          const isRunewagerSite = isRunewager(site);

          return (
            <div
              key={site.id}
              data-site-id={site.id}
              role="button"
              tabIndex={0}
              aria-label={`${site.name} casino account${linked ? ' - Linked' : ' - Not linked'}`}
              className={`group relative bg-bg-dark-2 border-2 rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-300 card-hover ${
                linked
                  ? 'border-neon-green/50 hover:border-neon-green hover:shadow-neon-green focus-visible:border-neon-green focus-visible:shadow-neon-green'
                  : 'border-neon-cyan/30 hover:border-neon-cyan/50 hover:shadow-neon-cyan focus-visible:border-neon-cyan focus-visible:shadow-neon-cyan'
              }`}
              onClick={() => handleCardClick(site)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(site);
                }
              }}
            >
              {/* Linked Badge */}
              {linked && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="px-2 py-1 bg-neon-green/20 border border-neon-green/50 rounded-full text-xs font-bold text-neon-green">
                    ✓ Linked
                  </span>
                </div>
              )}

              {/* Top Pick Crown */}
              {site.is_top_pick && (
                <div className="absolute top-2 left-2 z-10">
                  <span className="text-lg">👑</span>
                </div>
              )}

              {/* Tip Eligibility Badge - Show for eligible casinos when not linked */}
              {!linked && (isRunewagerSite || isWinna(site) || isCwallet(site)) && (
                <div className="absolute bottom-2 left-2 z-10">
                  <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-400/50 rounded-full text-xs font-bold text-yellow-400">
                    SC Tips Available
                  </span>
                </div>
              )}

              {/* Logo */}
              <div className="flex justify-center mb-3">
                <img
                  src={site.icon_url}
                  alt={site.name}
                  className="w-16 h-16 object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="%23000" width="64" height="64"/><text x="50%25" y="50%25" font-size="32" text-anchor="middle" dy=".3em" fill="%23fff">🎰</text></svg>';
                  }}
                />
              </div>

              {/* Name */}
              <h3 className="text-lg font-bold text-center mb-2 text-text-primary group-hover:text-neon-cyan transition-colors">
                {site.name}
              </h3>

              {/* Categories */}
              <div className="flex flex-wrap gap-1 justify-center mb-2">
                {categories.slice(0, 2).map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  if (!config) return null;
                  return (
                    <span
                      key={cat}
                      className={`px-2 py-0.5 text-xs rounded-full ${config.color} border border-current/30`}
                    >
                      {config.emblem} {cat}
                    </span>
                  );
                })}
              </div>

              {/* Jurisdiction */}
              <div
                className={`inline-block px-2 py-1 text-xs rounded-full mb-2 mx-auto ${jurisdictionConfig.bg} border border-current/30`}
              >
                {site.jurisdiction}
              </div>

              {/* Status & Quick Actions */}
              <div className="mt-2 space-y-2">
                {linked ? (
                  <div className="text-center">
                    <span className="text-neon-green text-sm font-semibold">Linked ✓</span>
                    <div className="mt-1 text-xs text-text-muted">
                      {isPinUnlocked ? (
                        <span>
                          {linked.identifierType}: {linked.identifierValue.substring(0, 8)}...
                        </span>
                      ) : (
                        <span>Unlock PIN to view</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-text-muted text-sm block text-center">Not linked</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRedirect(site);
                      }}
                      aria-label={`Quick join ${site.name}`}
                      className="w-full px-3 py-2 bg-gradient-to-r from-neon-pink to-neon-cyan text-white text-xs font-bold rounded-lg hover:shadow-neon-pink focus-visible:outline-3 focus-visible:outline-neon-cyan focus-visible:outline-offset-2 transition-all relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Quick Join
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-neon-pink opacity-0 group-hover:opacity-20 transition-opacity" />
                    </button>
                  </div>
                )}
              </div>

              {/* Hover Tooltip for Linked Sites */}
              {linked && (
                <div className="absolute inset-0 border-2 border-neon-green/0 group-hover:border-neon-green/50 rounded-xl transition-all duration-500 pointer-events-none" />
              )}
              
              {/* Tip Eligibility Badge - Show for linked accounts with tip eligibility */}
              {linked && tipEligibility.tipEligible && (
                <div className="absolute bottom-2 right-2 z-10">
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                    tipEligibility.tipEligible === true
                      ? 'bg-neon-yellow/20 border border-neon-yellow/50 text-yellow-400'
                      : 'bg-orange-500/20 border border-orange-400/50 text-orange-400'
                  }`}>
                    <span>💎</span>
                    <span>{tipEligibility.label}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Link Modal */}
      {showLinkModal && selectedSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-bg-dark-2 border-2 border-neon-cyan/50 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 neon-glow-cyan">Link Your Account</h3>
            <p className="text-text-muted mb-4">
              How do you log into <strong>{selectedSite.name}</strong>?
            </p>

            <form onSubmit={handleLink}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-neon-cyan mb-2">
                  Identifier Type
                </label>
                <select
                  value={identifierType}
                  onChange={(e) => setIdentifierType(e.target.value as 'username' | 'email' | 'player_id')}
                  className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
                >
                  <option value="username">Username</option>
                  <option value="email">Email</option>
                  <option value="player_id">Player ID</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-neon-cyan mb-2">
                  {identifierType === 'username' ? 'Username' : identifierType === 'email' ? 'Email' : 'Player ID'}
                </label>
                <input
                  type="text"
                  value={identifierValue}
                  onChange={(e) => setIdentifierValue(e.target.value)}
                  placeholder={`Enter your ${identifierType}`}
                  className="w-full bg-bg-dark border border-neon-cyan/30 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-neon-cyan"
                  required
                />
                {isRunewager(selectedSite) && (
                  <p className="text-xs text-text-muted mt-1">
                    Runewager: Username required, email optional but recommended
                  </p>
                )}
              </div>

              {linkError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-sm text-red-200">
                  {linkError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={linking || !identifierValue.trim()}
                  className="btn-neon flex-1 px-4 py-2 bg-neon-cyan text-bg-dark rounded-xl font-semibold hover:shadow-neon-cyan transition-all disabled:opacity-50"
                >
                  {linking ? 'Linking...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRedirect(selectedSite)}
                  className="px-4 py-2 bg-neon-pink/20 border border-neon-pink/50 rounded-xl text-neon-pink hover:bg-neon-pink/30 hover:shadow-neon-pink transition-all text-sm font-semibold"
                >
                  I haven't joined yet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkModal(false);
                    setSelectedSite(null);
                    setIdentifierValue('');
                    setLinkError('');
                  }}
                  className="px-4 py-2 text-text-muted hover:text-neon-cyan transition-colors rounded-xl hover:bg-bg-dark"
                >
                  Cancel
                </button>
              </div>

              {getLinkedSite(selectedSite.id) && (
                <div className="mt-4 pt-4 border-t border-neon-cyan/20">
                  <button
                    type="button"
                    onClick={() => handleUnlink(selectedSite.id)}
                    className="w-full px-4 py-2 bg-red-500/20 border border-red-400/50 rounded-xl text-red-400 hover:bg-red-500/30 transition-all text-sm font-semibold"
                  >
                    Unlink Account
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
};
