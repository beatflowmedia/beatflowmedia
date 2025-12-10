// scripts/crawlSupport.js
// Fetch and parse Spotify Support sitemap, then list category URLs
const fetch = require('node-fetch');
const { parseStringPromise } = require('xml2js');

async function crawlSupportCategories() {
  try {
    const sitemapUrl = 'https://support.spotify.com/sitemap.xml';
    console.log(`Fetching sitemap from ${sitemapUrl}...`);
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const xml = await response.text();
    const result = await parseStringPromise(xml);
    const urls = (result.urlset.url || []).map(entry => entry.loc[0]);
    // Filter for category endpoints (region-specific or general)
    const categoryUrls = urls.filter(u => /\/us\/(category|topics?)\//.test(u) || /\/(category|topics?)\//.test(u));
    console.log('Found category URLs:');
    categoryUrls.forEach(u => console.log(u));
  } catch (err) {
    console.error('Error crawling sitemap:', err);
    process.exit(1);
  }
}

crawlSupportCategories();
