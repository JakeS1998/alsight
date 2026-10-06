import React from 'react';
import { Search, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import useExpandingSearch from '@/components/search/useExpandingSearch';
import usePortalSearch from '@/components/search/usePortalSearch';
import SearchResults from '@/components/search/SearchResults';

export default function PortalSearch() {
  const { user } = useAuth();
  const search = useExpandingSearch();
  const { groups, loading, error, loadMore } = usePortalSearch(search.open ? search.term : '', user?.role);
  return <div ref={search.root} className="portal-search" data-open={search.open} onKeyDown={search.onKeyDown} onBlur={search.onBlur}>
    <button ref={search.trigger} type="button" onClick={() => search.setOpen(true)} aria-label="Search ALSight" aria-expanded={search.open} aria-controls="portal-global-search-field" tabIndex={search.open ? -1 : 0} className="portal-icon-button portal-search-trigger"><Search className="h-5 w-5" /></button>
    <div id="portal-global-search-field" role="search" aria-label="Global search" aria-hidden={!search.open} className="portal-search-field">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input ref={search.input} type="search" value={search.term} maxLength={80} tabIndex={search.open ? 0 : -1} onChange={event => search.setTerm(event.target.value)} aria-label="Search ALSight" aria-controls="portal-search-results" placeholder="Search ALSight" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      <button type="button" tabIndex={search.open ? 0 : -1} onClick={() => { if (search.term) { search.setTerm(''); search.input.current?.focus(); } else search.close(true); }} aria-label={search.term ? 'Clear search' : 'Close search'} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><X className="h-4 w-4" /></button>
    </div>
    {search.open && <div className="portal-search-results"><SearchResults groups={groups} loading={loading} error={error} term={search.term} onSelect={() => search.close()} onMore={loadMore} /></div>}
  </div>;
}