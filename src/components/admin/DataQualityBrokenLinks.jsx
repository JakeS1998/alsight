import React from 'react';
import { Link } from 'react-router-dom';
import { Link2Off, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useBrokenLinks from '@/components/admin/useBrokenLinks';
import BrokenLinkEditor from '@/components/admin/BrokenLinkEditor';
import BrokenLinkRecheck from '@/components/admin/BrokenLinkRecheck';
export default function DataQualityBrokenLinks({ refreshToken }) {
 const links = useBrokenLinks(refreshToken);
 return <section className="rounded-xl border border-border bg-card p-5 space-y-4">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div><h3 className="flex items-center gap-2 font-heading text-lg font-semibold"><Link2Off className="h-5 w-5 text-destructive" />Broken links</h3><p className="mt-1 text-sm text-muted-foreground">Missing or inaccessible document links reported by JCT, DMA and supplier appointment reads. Access failures may reflect permissions, not a deleted file.</p><p className="mt-1 text-xs text-muted-foreground">Recorded findings only, not a live scan of every link. Size limits and contractor-matching issues are excluded; changed links need a new document read to confirm access.</p></div>
   <Button variant="outline" disabled={links.isFetching} onClick={() => links.refetch()}><RefreshCw className={links.isFetching ? 'animate-spin' : ''} />Refresh</Button>
  </div>
  <div className="flex flex-wrap items-center gap-3"><label htmlFor="broken-link-source" className="text-sm font-medium">Document type</label><select id="broken-link-source" value={links.source} onChange={event => links.setSource(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">{[['jct','JCT'],['dma','DMA'],['appointment','Supplier appointment']].map(([key,label]) => <option key={key} value={key}>{label}{links.summary ? ` (${links.summary.counts.find(row => row.key === key)?.count || 0})` : ''}</option>)}</select>{links.summary && <span className="text-xs text-muted-foreground">{links.items.length} of {links.summary.total} recorded issues</span>}</div>
  {links.isError && <p role="alert" className="text-sm text-destructive">{links.error?.response?.data?.error || links.error?.message || 'Unable to load broken links.'}</p>}
  {links.isPending ? <p role="status" className="py-6 text-sm text-muted-foreground">Loading recorded link issues…</p> : !links.isError && !links.items.length ? <p className="py-6 text-sm text-muted-foreground">No recorded broken or missing links for this document type. Unchecked links are not confirmed healthy.</p> : links.items.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm">
   <thead className="border-b text-xs text-muted-foreground"><tr>{['Document / project','Status','Recorded issue','Actions'].map(label => <th key={label} className="py-3 pr-4">{label}</th>)}</tr></thead>
   <tbody>{links.items.map(item => <tr key={item.id} className="border-b last:border-0 align-top">
    <td className="min-w-48 py-3 pr-4"><Link to={item.href} className="font-medium underline underline-offset-4">{item.label}</Link><p className="mt-1 text-xs text-muted-foreground">{item.project}</p>{item.checkedAt && <p className="mt-1 text-xs text-muted-foreground">Recorded {new Date(item.checkedAt).toLocaleString('en-GB')}</p>}</td>
    <td className="py-3 pr-4"><span className={item.changed ? 'text-muted-foreground' : 'text-destructive'}>{item.category}</span></td>
    <td className="min-w-64 py-3 pr-4"><p>{item.reason}</p>{item.changed && <p className="mt-2 text-xs text-muted-foreground">{item.localLink ? 'Using an ALS Hub-only corrected link; the source record is unchanged. ' : ''}Read the corrected document again to confirm access and reconcile values.</p>}{item.url && <p className="mt-2 max-w-md break-all text-xs text-muted-foreground">{item.url}</p>}</td>
    <td className="py-3 space-y-2 whitespace-nowrap"><Link to={item.href} className="block underline underline-offset-4">Open record</Link>{item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="block underline underline-offset-4">Open saved link</a>}<BrokenLinkEditor item={item} source={links.source} onSaved={() => links.refetch()} /><BrokenLinkRecheck item={item} source={links.source} onSaved={() => links.refetch()} /></td>
   </tr>)}</tbody>
  </table></div>}
  {links.hasNextPage && <Button variant="outline" disabled={links.isFetching} onClick={() => links.fetchNextPage()}>{links.isFetchingNextPage ? 'Loading…' : 'Load more'}</Button>}
 </section>;
}