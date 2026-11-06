export default async function accountRegionNames(base44, accounts) {
  const ids = [...new Set(accounts.map(account => account.region?.toLowerCase()).filter(Boolean))];
  if (!ids.length) return accounts;
  const page = await base44.entities.RegionDirectory.filter({ dataverse_id: { $in: ids } }, { limit: 100 });
  if (page.has_more) throw new Error('Region directory requires pagination review.');
  const byId = new Map();
  for (const region of page.items) {
    const previous = byId.get(region.dataverse_id);
    byId.set(region.dataverse_id, previous ? { ambiguous: true } : region);
  }
  return accounts.map(account => {
    const region = byId.get(account.region?.toLowerCase());
    return { ...account, _region: !region || region.ambiguous ? null : {
      name: region.name, director_name: region.director_name, active: region.active,
      synced_at: region.synced_at, source: region.source
    } };
  });
}