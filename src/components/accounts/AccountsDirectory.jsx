import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import AccountFilters from '@/components/accounts/AccountFilters';
import AccountCard from '@/components/accounts/AccountCard';
import AccountList from '@/components/accounts/AccountList';
import useAccountsView from '@/components/accounts/useAccountsView';
import useAccountFilterOptions from '@/components/accounts/useAccountFilterOptions';
import '@/components/accounts/accounts.css';
export default function AccountsDirectory() {
  const [filters,setFilters] = useState({}), [search,setSearch] = useState(''), [cursor,setCursor] = useState(null), [history,setHistory] = useState([]), [view,setView] = useState('cards');
  useEffect(() => { const timer = setTimeout(() => { setFilters(old => ({ ...old, search })); setCursor(null); setHistory([]); },500); return () => clearTimeout(timer); },[search]);
  const result = useAccountsView({ filters, cursor });
  const options = useAccountFilterOptions();
  const change = (key,value) => { if (key === 'search') setSearch(value); else { setFilters(old => ({ ...old,[key]:value })); setCursor(null); setHistory([]); } };
  const rows = result.data?.items || [];
  return <div className="account-directory space-y-6">
    <div className="account-page-title"><div><h1 className="font-heading text-als-navy">Accounts</h1><p>One connected view of organisations, relationships and project activity.</p></div><div className="flex gap-2" aria-label="Account view">{['cards','list'].map(value => <Button key={value} aria-pressed={view === value} variant={view === value ? 'default' : 'outline'} onClick={() => setView(value)} className="capitalize">{value}</Button>)}</div></div>
    <AccountFilters filters={{ ...filters,search }} onChange={change} options={options.data || {}} />
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground"><p>{result.isPending ? 'Loading accounts…' : `${result.data?.total ?? 0} matching accounts`}</p><button type="button" className="font-semibold hover:underline" onClick={() => { setFilters({}); setSearch(''); setCursor(null); setHistory([]); }}>Reset filters</button></div>
    {(result.error || options.error) && <p role="alert" className="text-sm text-destructive">{result.error?.response?.data?.error || result.error?.message || options.error?.message}<button className="ml-2 underline" onClick={() => { result.refetch(); options.refetch(); }}>Try again</button></p>}
    {result.isPending ? <p role="status" className="account-panel text-sm text-muted-foreground">Loading organisation details and permitted account summaries…</p> : !result.error && !rows.length ? <p className="account-panel text-sm text-muted-foreground">No accounts match your filters.</p> : view === 'list' ? <AccountList rows={rows} /> : <div className="account-card-grid">{rows.map(row => <AccountCard key={row.account.id} {...row} />)}</div>}
    <div className="flex justify-between"><Button variant="outline" disabled={!history.length || result.isFetching} onClick={() => { setCursor(history.at(-1)); setHistory(old => old.slice(0,-1)); }}>Previous</Button><Button variant="outline" disabled={!result.data?.has_more || result.isFetching} onClick={() => { setHistory(old => [...old,cursor]); setCursor(result.data.next_cursor); }}>Next</Button></div>
  </div>;
}