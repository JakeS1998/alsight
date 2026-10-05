// Call only after verifying the caller can access the source account or project.
export async function cachedHeaderPhoto(base44, kind, recordId, search, options = {}) {
  const cacheKey = `${kind}:${recordId}`;
  const entity = base44.asServiceRole.entities.HeaderImageCache;
  const page = await entity.filter({ cache_key: cacheKey }, { limit: 1, fields: ['result','searched_at'] });
  const cached=page.items[0],age=cached ? Date.now()-Date.parse(cached.searched_at || '') : Infinity;
  // Preserve successful images; empty results expire, and manual retries are limited to once a minute.
  if (cached && (age<60000 || (!options.refresh && (cached.result?.url || age<5*60000)))) return { body: cached.result, status: 200 };
  const result = await search();
  // Empty successful searches are cached too; provider failures remain retryable.
  if (result.status === 200) {
    await entity.upsert([{ cache_key: cacheKey, result: result.body, searched_at: new Date().toISOString() }], { key: 'cache_key' });
  }
  return result;
}