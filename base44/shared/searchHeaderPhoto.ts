import { secrets } from 'base44:runtime';
export async function searchHeaderPhoto(query, caption, allowBroaderSearch = true) {
  const params = new URLSearchParams({ engine: 'google_images', q: query, api_key: await secrets.get('SERPAPI_API_KEY'), google_domain: 'google.co.uk', gl: 'uk', hl: 'en', safe: 'active' });
  const response = await fetch(`https://serpapi.com/search.json?${params}`, { signal: AbortSignal.timeout(20000) });
  const result = await response.json();
  if (!response.ok || result.error) {
    const message = String(result.error || '');
    if (/hasn.t returned|no results|empty/i.test(message)) {
      if (allowBroaderSearch && query.includes('"')) return searchHeaderPhoto(query.replaceAll('"',''), caption, false);
      return { body: { url: null }, status: 200 };
    }
    const reason = /invalid.*key|key.*invalid|api.?key/i.test(message) ? 'Image search credentials were rejected' : /run out|credit|limit|quota|exceed|plan/i.test(message) ? 'Image search allowance unavailable' : 'Image search is temporarily unavailable';
    return { body: { error: reason }, status: 502 };
  }
  const photo = (result.images_results || []).slice(0, 100).find(image => /^https:\/\//i.test(image.original || '') && !/(?:fbsbx|fbcdn|cdninstagram|pinterest)\./i.test(image.original) && !image.unsafe && !image.is_product && image.original_width >= 600 && image.original_width > image.original_height);
  if (!photo && allowBroaderSearch && query.includes('"')) return searchHeaderPhoto(query.replaceAll('"',''), caption, false);
  return { body: photo ? { url: photo.original, caption: photo.title || caption, sourceUrl: /^https:\/\//i.test(photo.link || '') ? photo.link : null } : { url: null }, status: 200 };
}