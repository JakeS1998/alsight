// Call only after verifying the caller can access the source account or project.
export async function cachedHeaderPhoto(base44, kind, recordId, search) {
  const cacheKey = `${kind}:${recordId}`;
  const entity = base44.asServiceRole.entities.HeaderImageCache;
  const page = await entity.filter({ cache_key: cacheKey }, { limit: 1, fields: ['result'] });
  if (page.items[0]) return { body: page.items[0].result, status: 200 };
  const result = await search();
  // Empty successful searches are cached too; provider failures remain retryable.
  if (result.status === 200) {
    await entity.upsert([{ cache_key: cacheKey, result: result.body, searched_at: new Date().toISOString() }], { key: 'cache_key' });
  }
  return result;
}