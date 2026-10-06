import React from 'react';
import { Button } from '@/components/ui/button';

export default function ProjectDocumentLoadState({ documents }) {
  if (documents.loading) return <p role="status" className="py-4 text-sm text-muted-foreground">Loading project documents…</p>;
  if (documents.error) return <div role="alert" className="flex flex-wrap items-center gap-3 rounded-panel border border-border bg-card p-4">
    <p className="text-sm text-destructive">The document list could not be loaded. This does not mean the documents are missing.</p>
    <Button type="button" variant="outline" disabled={documents.retrying} onClick={() => documents.retry()}>{documents.retrying ? 'Retrying…' : 'Retry documents'}</Button>
  </div>;
  if (documents.more) return <Button type="button" variant="outline" disabled={documents.loadingMore} onClick={() => documents.loadMore()}>{documents.loadingMore ? 'Loading…' : 'Load more project documents'}</Button>;
  return null;
}