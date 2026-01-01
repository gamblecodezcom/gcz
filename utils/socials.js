import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOCIALS_FILE = path.join(__dirname, '..', 'GambleCodez_socials.txt');

let cachedSocials = null;
let lastModified = 0;

function parseSocialsFile() {
  try {
    const stats = fs.statSync(SOCIALS_FILE);
    // Only re-read if file was modified
    if (stats.mtimeMs === lastModified && cachedSocials) {
      return cachedSocials;
    }
    lastModified = stats.mtimeMs;

    const content = fs.readFileSync(SOCIALS_FILE, 'utf-8');
    const socials = {
      telegram: {
        bot: 'https://t.me/GambleCodezCasinoDrops_bot',
        channel: 'https://t.me/GambleCodezDrops',
        group: 'https://t.me/GambleCodezPrizeHub',
      },
      twitter: 'https://x.com/GambleCodez',
      email: 'GambleCodez@gmail.com',
      cwalletAffiliateUrl: 'https://cwallet.com/referral/Nwnah81L',
      websiteUrl: 'https://gamblecodez.com',
    };

    // Parse the file line by line
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          const cleanKey = key.trim();
          const cleanValue = value.trim();

          switch (cleanKey) {
            case 'TELEGRAM_BOT':
              socials.telegram.bot = cleanValue;
              break;
            case 'TELEGRAM_CHANNEL':
              socials.telegram.channel = cleanValue;
              break;
            case 'TELEGRAM_GROUP':
              socials.telegram.group = cleanValue;
              break;
            case 'TWITTER':
              socials.twitter = cleanValue;
              break;
            case 'EMAIL':
              socials.email = cleanValue;
              break;
            case 'CWALLET_AFFILIATE_URL':
              socials.cwalletAffiliateUrl = cleanValue;
              break;
            case 'WEBSITE_URL':
              socials.websiteUrl = cleanValue;
              break;
          }
        }
      }
    });

    cachedSocials = socials;
    return socials;
  } catch (error) {
    console.error('Error reading socials file:', error);
    // Return defaults if file doesn't exist
    return {
      telegram: {
        bot: 'https://t.me/GambleCodezCasinoDrops_bot',
        channel: 'https://t.me/GambleCodezDrops',
        group: 'https://t.me/GambleCodezPrizeHub',
      },
      twitter: 'https://x.com/GambleCodez',
      email: 'GambleCodez@gmail.com',
      cwalletAffiliateUrl: 'https://cwallet.com/referral/Nwnah81L',
      websiteUrl: 'https://gamblecodez.com',
    };
  }
}

export function getSocials() {
  return parseSocialsFile();
}

export function getSocialsForAPI() {
  const socials = getSocials();
  return {
    telegram: socials.telegram,
    twitter: socials.twitter,
    email: socials.email,
    cwalletAffiliateUrl: socials.cwalletAffiliateUrl,
    websiteUrl: socials.websiteUrl,
  };
}
