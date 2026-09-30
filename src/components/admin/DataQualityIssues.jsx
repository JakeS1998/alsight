import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DataQualityDuplicateGroup from '@/components/admin/DataQualityDuplicateGroup';

export default function DataQualityIssues({ check, result, loading, onMore, onEdit }) {
  return <section className="rounded-xl border border-border bg-card p-5 space-y-4">
    <div><h3 className="font-heading text-lg font-semibold">{check.label}</h3><p className="text-sm text-muted-foreground">{check.description}</p></div>
    {result?.breakdown && <div className="flex flex-wrap gap-2">{result.breakdown.map(row => <span key={row.entity} className="rounded-md bg-muted px-2 py-1 text-xs">{row.entity}: {row.count}</span>)}</div>}
    {!result && loading ? <p role="status" className="py-8 text-sm text-muted-foreground">Checking records…</p> : result && <>
      <p className="text-xs text-muted-foreground">{result.items.length} of {result.total} {check.key === 'duplicates' ? 'groups' : 'records'}</p>
      {!result.items.length ? <p className="py-8 text-sm text-muted-foreground">No issues found for this check.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="border-b text-xs text-muted-foreground"><tr><th className="py-3 pr-4">Record</th><th className="py-3 pr-4">Type</th><th className="py-3">Issue</th><th className="py-3">Actions</th></tr></thead>
        <tbody>{result.items.map(item => <tr key={item.id} className="border-b last:border-0 align-top">
          <td className="py-3 pr-4 min-w-48">{item.href ? <Link className="font-medium text-foreground underline underline-offset-4 hover:text-primary" to={item.href}>{item.label}</Link> : <span className="font-medium">{item.label}</span>}<p className="text-xs text-muted-foreground">{item.reference}</p>
            {item.related && <div className="mt-2 space-y-1">{item.related.map(link => <Link key={link.href} to={link.href} className="block text-xs underline">{link.label}</Link>)}{item.moreContacts && <Link to="/contacts" className="block text-xs underline">More contacts in directory</Link>}</div>}
          </td><td className="py-3 pr-4 text-muted-foreground">{item.entity}</td><td className="py-3 pr-4 min-w-64">{item.reason}</td><td className="py-3 whitespace-nowrap">{check.key === 'duplicates' ? <DataQualityDuplicateGroup item={item} onEdit={onEdit} /> : <Button type="button" size="sm" variant="outline" onClick={() => onEdit({ recordId: item.id.includes(':') ? item.id.split(':')[1] : item.id, entity: item.entity, label: item.label })}>Edit data</Button>}</td>
        </tr>)}</tbody>
      </table></div>}
      {result.nextOffset !== null && <Button variant="outline" disabled={loading} onClick={onMore}>{loading ? 'Loading…' : 'Load more'}</Button>}
    </>}
  </section>;
}