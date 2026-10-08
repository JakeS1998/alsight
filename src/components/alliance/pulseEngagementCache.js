export default function pulseEngagementCache(cache, postId, changes) {
  cache.setQueriesData({ queryKey: ['alliance-layer', 'home'] }, old => old ? { ...old, pages: old.pages.map(page => page.engagement?.[postId] ? ({ ...page, engagement: { ...page.engagement, [postId]: { ...page.engagement[postId], ...changes } } }) : page) } : old);
}