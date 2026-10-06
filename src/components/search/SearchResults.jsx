import React from 'react';
import { Link } from 'react-router-dom';

export default function SearchResults({ groups, loading, error, term, onSelect, onMore }) {
  return <div id="portal-search-results" role="status" aria-live="polite" className="max-h-[min(65vh,570px)] overflow-y-auto border-t border-border bg-card text-card-foreground">
    {term.trim().length < 2 ? <p className="p-5 text-sm text-muted-foreground">Type at least two characters to search.</p> : <>
      {loading && <p className="p-5 text-sm text-muted-foreground">Searching ALSight…</p>}
      {error && <p className="px-5 pt-4 text-sm text-destructive">{error}</p>}
      {!loading && !groups.length && <p className="p-5 text-sm text-muted-foreground">No matching records found.</p>}
      {groups.map(group => <section key={group.label} aria-label={group.label} className="border-b border-border last:border-0">
        <h3 className="px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h3>
        {group.items.map(item => <Link key={item.id} to={item.path} onClick={onSelect} className="block px-5 py-2.5 hover:bg-secondary focus:bg-secondary focus:outline-none">
          <span className="block truncate text-sm font-medium">{item.title}</span>
          {item.detail && <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>}
        </Link>)}
        {group.more && <button type="button" disabled={group.loadingMore} onClick={() => onMore(group)} className="px-5 pb-3 pt-1 text-xs font-medium text-primary hover:underline disabled:opacity-50">{group.loadingMore ? 'Loading…' : 'Show more'}</button>}
      </section>)}
    </>}
  </div>;
}