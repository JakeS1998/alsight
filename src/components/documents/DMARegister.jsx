import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import DMADirectoryCard from '@/components/documents/DMADirectoryCard';
export default function DMARegister() {
  const [docs, setDocs] = useState([]), [projects, setProjects] = useState({});
  const [cursor, setCursor] = useState(''), [hasMore, setHasMore] = useState(false), [loading, setLoading] = useState(true);
  async function load(nextCursor) {
    setLoading(true);
    try {
      const page = await base44.entities.DMA.filter({ dataverse_id: { $exists: true, $nin: [null, ''] } }, { sort: '-updated_date', limit: 50, ...(nextCursor ? { cursor: nextCursor } : {}) });
      const ids = [...new Set(page.items.map(doc => doc.project_id).filter(Boolean))];
      const linked = ids.length ? await base44.entities.Project.filter({ dataverse_id: { $in: ids } }, { limit: 100, fields: ['name', 'dataverse_id'] }) : { items: [] };
      setProjects(old => ({ ...old, ...Object.fromEntries(linked.items.map(project => [project.dataverse_id, project])) }));
      setDocs(old => nextCursor ? [...old, ...page.items] : page.items);
      setCursor(page.next_cursor); setHasMore(page.has_more);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  return <section className="space-y-4">
    <div><h2 className="text-lg font-semibold text-foreground">Development Agreements (DMA)</h2><p className="mt-1 text-sm text-muted-foreground">Dataverse records only. Missing values are shown in red.</p></div>
    <div className="portal-card-grid">{docs.map(doc => <DMADirectoryCard key={doc.id} doc={doc} project={projects[doc.project_id]} />)}</div>
    {loading && <p role="status" className="text-sm text-muted-foreground">Loading development agreements…</p>}
    {!loading && !docs.length && <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No Dataverse development agreements are available.</p>}
    {hasMore && <Button variant="outline" disabled={loading} onClick={() => load(cursor)}>{loading ? 'Loading…' : 'Load more development agreements'}</Button>}
  </section>;
}