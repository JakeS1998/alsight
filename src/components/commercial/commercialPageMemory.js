export function commercialPageRequest(view, page) {
  return view === 'board' ? { stages: [page.stage], cursors: { [page.stage]: page.next_cursor } } : { cursor: page.next_cursor };
}
export function mergeCommercialPage(old, next, view, stage) {
  return view === 'board'
    ? { ...old, board: old.board.map(page => page.stage === stage ? { ...next.board[0], items: [...page.items, ...next.board[0].items] } : page) }
    : { ...old, listing: { ...next.listing, items: [...old.listing.items, ...next.listing.items] } };
}
// Rebuild the same number of expanded pages with fresh server cursors on refetch.
export async function loadCommercialPages(request, parameters, expanded = {}) {
  let data = await request(parameters);
  for (let index = 0; index < Math.max(0, ...Object.values(expanded)); index++) {
    const pages = parameters.view === 'board'
      ? data.board.filter(page => page.has_more && (expanded[page.stage] || 0) > index)
      : data.listing?.has_more && (expanded.list || 0) > index ? [data.listing] : [];
    const results = await Promise.all(pages.map(page => request({ ...parameters, ...commercialPageRequest(parameters.view, page) })));
    results.forEach((next, i) => { data = mergeCommercialPage(data, next, parameters.view, pages[i].stage); });
  }
  return data;
}