import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/Common/SEOHead';
import { SiteCard } from '../components/Sites/SiteCard';
import type { SiteCard as SiteCardType, SiteType, RedemptionSpeed, RedemptionType } from '../types';

const BASE_URL = 'https://gamblecodez.com';

interface CasinoDetails {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  affiliateUrl: string | null;
  jurisdiction: string;
  category: string;
  categories: string[];
  level: number | null;
  bonusCode: string | null;
  bonusDescription: string | null;
  redemptionSpeed: string | null;
  redemptionMinimum: string | null;
  redemptionType: string | null;
  resolvedDomain: string | null;
  isTopPick: boolean;
  createdAt: string | null;
}

export const Casino = () => {
  const { slug } = useParams<{ slug: string }>();
  const [casino, setCasino] = useState<CasinoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCasino = async () => {
      if (!slug) {
        setError('Invalid casino slug');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/casino/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Casino not found');
          } else {
            setError('Failed to load casino details');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setCasino(data);
      } catch (err) {
        console.error('Failed to fetch casino:', err);
        setError('Failed to load casino details');
      } finally {
        setLoading(false);
      }
    };

    fetchCasino();
  }, [slug]);

  if (loading) {
    return (
      <>
        <SEOHead
          title="Loading Casino..."
          description="Loading casino details..."
        />
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan"></div>
        </div>
      </>
    );
  }

  if (error || !casino) {
    return (
      <>
        <SEOHead
          title="Casino Not Found | GambleCodez"
          description="The requested casino could not be found."
        />
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 neon-glow-cyan">Casino Not Found</h1>
            <p className="text-text-muted mb-4">{error || 'The requested casino could not be found.'}</p>
            <Link to="/affiliates" className="text-neon-cyan hover:underline">
              Browse All Casinos →
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Build SEO metadata
  const title = `${casino.name} – Casino Review & Bonus Codes | GambleCodez`;
  const description = casino.description || 
    `${casino.name} casino review. ${casino.bonusDescription || 'Get exclusive bonus codes and affiliate links.'} ${casino.redemptionSpeed ? `Redemption: ${casino.redemptionSpeed}.` : ''}`;
  const canonical = `${BASE_URL}/casino/${casino.slug}`;
  const ogImage = casino.iconUrl || `${BASE_URL}/og-image.jpg`;

  // Build structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: casino.name,
    url: casino.resolvedDomain ? `https://${casino.resolvedDomain}` : casino.affiliateUrl,
    logo: casino.iconUrl,
    description: description,
    ...(casino.resolvedDomain && {
      sameAs: [`https://${casino.resolvedDomain}`],
    }),
  };

  // Convert to SiteCard format for display
  const siteCard: SiteCardType = {
    id: casino.id,
    name: casino.name,
    slug: casino.slug,
    icon_url: casino.iconUrl || '',
    priority: typeof casino.level === 'number' ? casino.level : 0,
    status: 'active',
    jurisdiction: casino.jurisdiction as any,
    category: casino.category || '',
    categories: (casino.categories || []) as SiteType[],
    level: casino.level?.toString(),
    bonus_code: casino.bonusCode || undefined,
    bonus_description: casino.bonusDescription || undefined,
    redemption_speed: (casino.redemptionSpeed as RedemptionSpeed) || undefined,
    redemption_minimum: typeof casino.redemptionMinimum === 'number' ? casino.redemptionMinimum : (casino.redemptionMinimum ? parseFloat(casino.redemptionMinimum.toString()) : undefined),
    redemption_type: (casino.redemptionType as RedemptionType) || undefined,
    resolveddomain: casino.resolvedDomain || '',
    is_top_pick: casino.isTopPick,
    redirect_slug: casino.slug,
    redirect_url: casino.affiliateUrl || undefined,
    date_added: casino.createdAt || new Date().toISOString(),
  };

  return (
    <>
      <SEOHead
        title={title}
        description={description}
        keywords={`${casino.name}, casino, ${casino.categories.join(', ')}, ${casino.jurisdiction}, bonus codes, affiliate`}
        canonical={canonical}
        ogImage={ogImage}
        structuredData={structuredData}
      />
      <div className="min-h-screen pt-24 px-4 pb-12">
        <div className="container mx-auto max-w-4xl">
          {/* Casino Header */}
          <div className="mb-8">
            <div className="flex items-start gap-6 mb-6">
              {casino.iconUrl && (
                <img
                  src={casino.iconUrl}
                  alt={casino.name}
                  className="w-24 h-24 rounded-xl object-contain bg-bg-dark-2 p-2 border-2 border-neon-cyan/20"
                />
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold font-orbitron mb-2 neon-glow-cyan">
                  {casino.name}
                  {casino.isTopPick && (
                    <span className="ml-3 text-2xl" title="Top Pick">👑</span>
                  )}
                </h1>
                {casino.description && (
                  <p className="text-text-muted text-lg mb-4">{casino.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {casino.categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50"
                    >
                      {cat}
                    </span>
                  ))}
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neon-pink/20 text-neon-pink border border-neon-pink/50">
                    {casino.jurisdiction}
                  </span>
                </div>
              </div>
            </div>

            {casino.bonusDescription && (
              <div className="p-4 bg-gradient-to-br from-neon-cyan/10 to-neon-pink/10 rounded-xl border-2 border-neon-cyan/30 mb-6">
                <h2 className="text-xl font-bold text-neon-cyan mb-2">Bonus Offer</h2>
                <p className="text-text-muted">{casino.bonusDescription}</p>
                {casino.bonusCode && (
                  <div className="mt-3">
                    <span className="text-sm text-text-muted">Bonus Code: </span>
                    <span className="font-mono font-bold text-neon-yellow">{casino.bonusCode}</span>
                  </div>
                )}
              </div>
            )}

            {casino.redemptionSpeed && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-bg-dark-2 rounded-xl border border-neon-cyan/20">
                  <div className="text-sm text-text-muted mb-1">Redemption Speed</div>
                  <div className="text-lg font-bold text-neon-cyan">{casino.redemptionSpeed}</div>
                </div>
                {casino.redemptionMinimum && (
                  <div className="p-4 bg-bg-dark-2 rounded-xl border border-neon-cyan/20">
                    <div className="text-sm text-text-muted mb-1">Minimum</div>
                    <div className="text-lg font-bold text-neon-cyan">{casino.redemptionMinimum}</div>
                  </div>
                )}
                {casino.redemptionType && (
                  <div className="p-4 bg-bg-dark-2 rounded-xl border border-neon-cyan/20">
                    <div className="text-sm text-text-muted mb-1">Redemption Type</div>
                    <div className="text-lg font-bold text-neon-cyan">{casino.redemptionType}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Casino Card Display */}
          <div className="mb-8">
            <SiteCard site={siteCard} />
          </div>

          {/* Internal Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link
              to="/drops"
              className="p-6 bg-gradient-to-br from-bg-dark-2 to-bg-dark-3 rounded-xl border-2 border-neon-cyan/20 hover:border-neon-cyan/50 transition-all card-hover"
            >
              <h3 className="text-xl font-bold text-neon-cyan mb-2">🎰 Daily Drops</h3>
              <p className="text-text-muted">Check for daily promo codes and bonus links</p>
            </Link>
            <Link
              to="/raffles"
              className="p-6 bg-gradient-to-br from-bg-dark-2 to-bg-dark-3 rounded-xl border-2 border-neon-pink/20 hover:border-neon-pink/50 transition-all card-hover"
            >
              <h3 className="text-xl font-bold text-neon-pink mb-2">🎁 Live Raffles</h3>
              <p className="text-text-muted">Enter raffles to win crypto and Cwallet rewards</p>
            </Link>
            <Link
              to="/wheel"
              className="p-6 bg-gradient-to-br from-bg-dark-2 to-bg-dark-3 rounded-xl border-2 border-neon-yellow/20 hover:border-neon-yellow/50 transition-all card-hover"
            >
              <h3 className="text-xl font-bold text-neon-yellow mb-2">🎡 Degen Wheel</h3>
              <p className="text-text-muted">Spin daily for instant rewards and bonus codes</p>
            </Link>
            <Link
              to="/dashboard"
              className="p-6 bg-gradient-to-br from-bg-dark-2 to-bg-dark-3 rounded-xl border-2 border-neon-green/20 hover:border-neon-green/50 transition-all card-hover"
            >
              <h3 className="text-xl font-bold text-neon-green mb-2">📊 Degen Profile</h3>
              <p className="text-text-muted">Link your casino accounts and track rewards</p>
            </Link>
          </div>

          {/* Back to All Casinos */}
          <div className="text-center">
            <Link
              to="/affiliates"
              className="inline-block px-6 py-3 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors border border-neon-cyan/50"
            >
              ← Browse All Casinos
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
