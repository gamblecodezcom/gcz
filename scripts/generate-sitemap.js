import pool from '../utils/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://gamblecodez.com';
const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

async function generateSitemap() {
  try {
    // Static pages
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/drops', priority: '0.9', changefreq: 'daily' },
      { loc: '/raffles', priority: '0.9', changefreq: 'daily' },
      { loc: '/wheel', priority: '0.8', changefreq: 'daily' },
      { loc: '/affiliates', priority: '0.8', changefreq: 'weekly' },
      { loc: '/sites/recent', priority: '0.8', changefreq: 'daily' },
      { loc: '/leaderboard', priority: '0.7', changefreq: 'daily' },
      { loc: '/blacklist', priority: '0.7', changefreq: 'weekly' },
      { loc: '/contact', priority: '0.6', changefreq: 'monthly' },
      { loc: '/terms', priority: '0.5', changefreq: 'monthly' },
      { loc: '/privacy', priority: '0.5', changefreq: 'monthly' },
    ];

    // Fetch all casino slugs from database
    let casinoPages = [];
    try {
      const result = await pool.query(
        'SELECT slug FROM affiliates_master WHERE slug IS NOT NULL AND slug != \'\' ORDER BY slug'
      );
      casinoPages = result.rows.map(row => ({
        loc: `/casino/${row.slug}`,
        priority: '0.7',
        changefreq: 'weekly',
      }));
      console.log(`Found ${casinoPages.length} casino pages to include in sitemap`);
    } catch (error) {
      console.error('Error fetching casino slugs:', error);
      console.warn('Continuing without casino pages...');
    }

    // Generate XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add casino pages
    for (const page of casinoPages) {
      xml += `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    xml += `</urlset>
`;

    // Write to file
    const sitemapPath = path.join(__dirname, '../frontend/public/sitemap.xml');
    fs.writeFileSync(sitemapPath, xml, 'utf8');
    console.log(`✅ Sitemap generated successfully: ${sitemapPath}`);
    console.log(`   Total URLs: ${staticPages.length + casinoPages.length}`);
    console.log(`   - Static pages: ${staticPages.length}`);
    console.log(`   - Casino pages: ${casinoPages.length}`);

    // Close database connection
    await pool.end();
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();
