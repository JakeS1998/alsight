import React from 'react';
import {formatDateTime} from '@/lib/portal';
export default function ASEPublicationDetails({assessment}) {
  if(!assessment.published_by_id) return null;
  return <section className="space-y-2 rounded-lg border border-border p-4 text-sm"><h3 className="font-semibold">Publication record</h3><p>Published by {assessment.published_by_name} · {formatDateTime(assessment.assessment_date)}</p><p className="text-xs text-muted-foreground">{assessment.publication_mode==='automatic' ? 'Automatically validated at' : 'Preview reviewed at'} {formatDateTime(assessment.reviewed_at)} · {assessment.selected_evidence_count} evidence records selected for scoring · {assessment.snapshot_evidence_count} preserved in the snapshot.</p>{assessment.publication_note && <p className="whitespace-pre-wrap">{assessment.publication_note}</p>}</section>;
}