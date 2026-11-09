import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageContentSkeleton from '@/components/loading/PageContentSkeleton';
import { bssRegisters } from '@/components/bss/bssConfig';
import useBssRegister from '@/components/bss/useBssRegister';
import BssRegisterFilters from '@/components/bss/BssRegisterFilters';
import BssRegisterTable from '@/components/bss/BssRegisterTable';
import BssRecordDetail from '@/components/bss/BssRecordDetail';
export default function BssRegister({ tab }) {
  const state = useBssRegister(tab), [selected, setSelected] = useState(null);
  return <section className="space-y-4">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">{bssRegisters[tab].label}</h2><p className="mt-1 text-xs text-muted-foreground">{state.count.data === undefined ? 'Records available to you' : `${state.count.data.toLocaleString()} matching records`} · Synced ALS Hub data</p></div><Button variant="outline" size="sm" onClick={state.retry} disabled={state.records.isFetching}><RefreshCw className={state.records.isFetching ? 'animate-spin' : ''} />Refresh</Button></div>
    <BssRegisterFilters tab={tab} state={state} />
    {state.search && tab !== 'projects' && <p className="text-xs text-muted-foreground">Project-name search matches up to 100 accessible projects. Use a specific project name or reference to narrow results.</p>}
    {state.error ? <div role="alert" className="rounded-panel border border-border bg-card p-5"><p className="text-sm text-destructive">These records could not be loaded. {state.error.message}</p><Button variant="outline" size="sm" onClick={state.retry} className="mt-3">Retry</Button></div> : state.loading ? <PageContentSkeleton header={false} cards={0} label="Loading BSS records" /> : state.rows.length ? <BssRegisterTable rows={state.rows} tab={tab} onSelect={setSelected} /> : <div className="rounded-panel border border-dashed border-border bg-card px-5 py-14 text-center text-sm text-muted-foreground">No accessible records match these filters.</div>}
    {state.records.hasNextPage && !state.error && <div className="flex justify-center"><Button variant="outline" onClick={() => state.records.fetchNextPage()} disabled={state.records.isFetchingNextPage}>{state.records.isFetchingNextPage ? 'Loading…' : 'Load more'}</Button></div>}
    {selected && <BssRecordDetail key={selected.record.id} row={selected} tab={tab} onClose={() => setSelected(null)} />}
  </section>;
}