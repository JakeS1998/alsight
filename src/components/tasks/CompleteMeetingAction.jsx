import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
export default function CompleteMeetingAction({ task, onComplete }) {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function complete() {
    setBusy(true); setError('');
    try {
      if (onComplete) await onComplete(task);
      else {
        const { data } = await base44.functions.invoke('completeAssignedTask', { entity: 'ProjectAction', id: task.id });
        if (data.error) throw new Error(data.error);
      }
      await client.invalidateQueries({ predicate: query => ['assigned-tasks', 'adaptive-today', 'adaptive-task-drilldown', 'meeting-actions', 'meeting-follow-up', 'workspace-action-metrics'].includes(query.queryKey[0]) });
      window.dispatchEvent(new Event('alsight-tasks-changed'));
    } catch (e) { setError(e.response?.data?.error || e.message || 'Unable to complete this action.'); }
    finally { setBusy(false); }
  }
  return <div className="mt-2 space-y-1"><Button type="button" size="sm" variant="outline" disabled={busy} aria-label={`Mark complete: ${task.title}`} onClick={complete}>{busy ? 'Saving…' : 'Mark complete'}</Button>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}</div>;
}