import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from 'react-router-dom';
import usePortalSearch from '@/components/search/usePortalSearch';
import SearchResults from '@/components/search/SearchResults';

export default function PortalSearch() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false), [term, setTerm] = useState('');
  const input = useRef(null);
  const { groups, loading, error, loadMore } = usePortalSearch(open ? term : '', user?.role);
  const close = () => { setOpen(false); setTerm(''); };
  useEffect(() => { close(); }, [pathname]);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = event => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);
  return <div className="shrink-0">
    <button type="button" onClick={() => setOpen(true)} aria-label="Search portal" aria-expanded={open} className="flex h-9 items-center gap-2 rounded-lg border border-white/20 px-2.5 text-sm text-white/80 hover:bg-white/10 xl:min-w-20 2xl:min-w-32"><Search className="h-4 w-4" /><span className="hidden xl:inline">Search</span></button>
    {open && <>
      <button type="button" aria-label="Close search" onClick={close} className="fixed inset-0 z-40 cursor-default bg-als-navy/40" />
      <div role="dialog" aria-label="Search portal records" className="fixed left-3 right-3 top-20 z-50 overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:left-auto sm:right-8 sm:w-[min(540px,calc(100vw-2rem))]">
        <div className="flex items-center gap-2 px-4 py-3 text-card-foreground"><Search className="h-5 w-5 shrink-0 text-muted-foreground" /><input ref={input} type="search" value={term} onChange={e => setTerm(e.target.value)} aria-label="Search all portal records" aria-controls="portal-search-results" placeholder="Search projects, documents, contacts…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><button type="button" onClick={close} aria-label="Close search" className="rounded p-1 hover:bg-secondary"><X className="h-4 w-4" /></button></div>
        <SearchResults groups={groups} loading={loading} error={error} term={term} onSelect={close} onMore={loadMore} />
      </div>
    </>}
  </div>;
}