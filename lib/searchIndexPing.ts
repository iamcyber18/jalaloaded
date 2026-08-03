/**
 * Search Engine Auto-Indexing Service
 * Automatically pings Google, Bing, and IndexNow protocol when content is published on Jalaloaded.
 */

const CANONICAL_DOMAIN = 'https://jalaloaded.vercel.app';
const HOST = 'jalaloaded.vercel.app';
const INDEXNOW_KEY = 'jalaloaded2026indexnowkey';

export async function notifySearchEngines(urlPath: string | string[]) {
  const paths = Array.isArray(urlPath) ? urlPath : [urlPath];
  const urlList = paths.map((p) => (p.startsWith('http') ? p : `${CANONICAL_DOMAIN}${p.startsWith('/') ? '' : '/'}${p}`));
  const sitemapUrl = `${CANONICAL_DOMAIN}/sitemap.xml`;

  console.log(`[Auto-Indexer] Notifying search engines for ${urlList.length} URL(s):`, urlList);

  const results = {
    googlePing: false,
    bingPing: false,
    indexNow: false,
  };

  // 1. Ping Google Sitemap Endpoint
  try {
    const googleRes = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, {
      method: 'GET',
      headers: { 'User-Agent': 'Jalaloaded-AutoIndexer/1.0' },
    });
    results.googlePing = googleRes.ok || googleRes.status === 200;
  } catch (err) {
    console.warn('[Auto-Indexer] Google ping failed:', err);
  }

  // 2. Ping Bing Sitemap Endpoint
  try {
    const bingRes = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, {
      method: 'GET',
      headers: { 'User-Agent': 'Jalaloaded-AutoIndexer/1.0' },
    });
    results.bingPing = bingRes.ok || bingRes.status === 200;
  } catch (err) {
    console.warn('[Auto-Indexer] Bing ping failed:', err);
  }

  // 3. Instant Indexing via IndexNow Protocol (Bing, Yandex, Seznam, Naver)
  try {
    const indexNowRes = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `${CANONICAL_DOMAIN}/${INDEXNOW_KEY}.txt`,
        urlList: urlList,
      }),
    });
    results.indexNow = indexNowRes.ok || indexNowRes.status === 200 || indexNowRes.status === 202;
  } catch (err) {
    console.warn('[Auto-Indexer] IndexNow protocol submission failed:', err);
  }

  console.log('[Auto-Indexer] Indexing Notification Summary:', results);
  return results;
}
