import React, { useState } from 'react';
import useAliceChangeHistory from '@/components/alice/useAliceChangeHistory';
import { useAuth } from '@/lib/AuthContext';
import useProject360 from '@/components/projects/useProject360';
import AliceInsight from '@/components/alice/AliceInsight';
import { visitSnapshot, materialProjectChanges } from '@/components/alice/materialProjectChanges';
import { formatDate } from '@/lib/portal';
export default function ProjectChanges({ project, legalDocs, dmas, jcts }) {
  const { user } = useAuth();
  const [dismissedError, setDismissedError] = useState('');
  const query = useProject360(project);
  const key = `alice-visits:v1:${user?.id}:${user?.role}:${project.id}`;
  const documents = [...legalDocs, ...dmas, ...jcts];
  const snapshot = query.data ? visitSnapshot(project, query.data.delivery, documents) : null;
  const encoded = snapshot ? JSON.stringify({ fields: snapshot.fields, documents: snapshot.documents }) : '';
  const history = useAliceChangeHistory(key, encoded, !!user?.id && !query.error);
  const previous = history.acknowledged || history.previous;
  if (snapshot && !query.error && history.acknowledged && !materialProjectChanges(history.acknowledged, snapshot, project, documents).length) return null;
  if (query.isPending) return <p role="status" className="text-sm text-muted-foreground">Loading ALICE Changes…</p>;
  if (query.error) return dismissedError === key ? null : <AliceInsight title="ALICE Changes" onAcknowledge={() => setDismissedError(key)} statements={[{ text: 'Material changes could not be established from the accessible records.' }]} />;
  const events = materialProjectChanges(previous, snapshot, project, documents);
  const statements = [{ text: previous ? `Since your last recorded ${history.acknowledged ? 'acknowledgement' : 'visit'} on ${formatDate(previous.at)} (this browser):` : 'Recent material changes — recorded execution events in the last 30 days. Previous visit history is unavailable.' }, ...(events.length ? events.slice(0, 3) : [{ text: previous ? 'No material changes since your last visit.' : 'No dated material execution events are recorded in this period.' }])];
  return <AliceInsight title="ALICE Changes" onAcknowledge={history.acknowledge} statements={statements} evidence={events} detail="This view compares recorded PC dates and agreement execution/PO statuses against your last acknowledgement, or previous visit if nothing has been acknowledged, in this browser. It is not a full audit log and does not track every field, risk or valuation change. No historical value is inferred from a last-updated timestamp." />;
}