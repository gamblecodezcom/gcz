import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  structuredData?: object;
}

const BASE_URL = 'https://gamblecodez.com';

const defaultSEO = {
  title: 'GambleCodez – Casino Drops, Raffles & Cwallet Rewards',
  description: 'Track casino drops, enter raffles, and redeem Cwallet-ready rewards. Redeem today, flex tomorrow.',
  keywords: 'casino drops, promo codes, raffles, sweeps, crypto casino, Cwallet, gambling rewards',
  ogImage: `${BASE_URL}/og-image.jpg`,
};

export const SEOHead = ({
  title,
  description,
  keywords,
  ogImage,
  canonical,
  noindex = false,
  structuredData,
}: SEOHeadProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const fullUrl = `${BASE_URL}${currentPath}`;
  const canonicalUrl = canonical || fullUrl;

  const finalTitle = title ? `${title} | GambleCodez` : defaultSEO.title;
  const finalDescription = description || defaultSEO.description;
  const finalKeywords = keywords || defaultSEO.keywords;
  const finalOgImage = ogImage || defaultSEO.ogImage;

  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Primary meta tags
    updateMetaTag('title', finalTitle);
    updateMetaTag('description', finalDescription);
    updateMetaTag('keywords', finalKeywords);
    updateMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph tags
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:url', fullUrl, true);
    updateMetaTag('og:title', finalTitle, true);
    updateMetaTag('og:description', finalDescription, true);
    updateMetaTag('og:image', finalOgImage, true);
    updateMetaTag('og:site_name', 'GambleCodez', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:url', fullUrl, true);
    updateMetaTag('twitter:title', finalTitle, true);
    updateMetaTag('twitter:description', finalDescription, true);
    updateMetaTag('twitter:image', finalOgImage, true);

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Structured data
    if (structuredData) {
      let scriptTag = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    }
  }, [finalTitle, finalDescription, finalKeywords, finalOgImage, fullUrl, canonicalUrl, noindex, structuredData]);

  return null;
};

// Pre-configured SEO for common pages
export const pageSEO = {
  home: {
    title: 'GambleCodez – Casino Drops, Raffles & Cwallet Rewards',
    description: 'Track casino drops, enter raffles, and redeem Cwallet-ready rewards. Redeem today, flex tomorrow.',
    keywords: 'casino drops, promo codes, raffles, sweeps, crypto casino, Cwallet, gambling rewards',
  },
  drops: {
    title: 'Casino Drops – Live Promo Codes & Bonus Links',
    description: 'Real-time casino promo codes, bonus links, and exclusive drops. Filter by USA Daily, Crypto Daily, or Everywhere.',
    keywords: 'casino drops, promo codes, bonus codes, casino promos, daily drops, USA casino, crypto casino',
  },
  raffles: {
    title: 'Live Casino Raffles – Win Crypto & Cwallet Rewards',
    description: 'Enter live casino raffles, track your entries, and win crypto, Cwallet tips, and platform rewards.',
    keywords: 'casino raffles, crypto raffles, Cwallet rewards, sweepstakes, casino contests',
  },
  wheel: {
    title: 'Degen Wheel – Daily Spin for Instant Rewards',
    description: 'Spin the Degen Wheel daily for instant rewards, bonus codes, and exclusive perks.',
    keywords: 'degen wheel, daily spin, casino wheel, instant rewards, bonus wheel',
  },
  affiliates: {
    title: 'All Casino Sites – Curated Sweeps, Crypto & More',
    description: 'Browse curated sweeps, crypto, lootbox, and faucet casino sites. Filter by jurisdiction and category.',
    keywords: 'casino sites, sweeps casinos, crypto casinos, online casinos, casino directory',
  },
  dashboard: {
    title: 'Dashboard – Your GambleCodez Profile & Rewards',
    description: 'View your linked casino accounts, raffle entries, giveaway rewards, wheel spins, and activity log.',
    keywords: 'casino dashboard, player profile, raffle entries, rewards, linked accounts',
  },
  contact: {
    title: 'Contact Us – Get in Touch with GambleCodez',
    description: 'Have a question or feedback? Contact the GambleCodez team.',
    keywords: 'contact GambleCodez, support, help, feedback',
  },
  terms: {
    title: 'Terms of Service – GambleCodez',
    description: 'Read the GambleCodez terms of service and user agreement.',
    keywords: 'terms of service, user agreement, legal',
  },
  privacy: {
    title: 'Privacy Policy – GambleCodez',
    description: 'Read the GambleCodez privacy policy and data protection information.',
    keywords: 'privacy policy, data protection, GDPR',
  },
};
