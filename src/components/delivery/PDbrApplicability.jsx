import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/portal';

export default function PDbrApplicability({ review }) {
  const { decision, isPending, error, refetch, canEdit, saveDecision } = review;
  const [status, setStatus] = useState('required');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [saveError, setSaveError] = useState('');
  useEffect(() => { setStatus(decision?.applicability || 'required'); setReason(decision?.reason || ''); }, [decision?.id]);
  const save = async event => {
    event.preventDefault(); setSaving(true); setFeedback(''); setSaveError('');
    try { await saveDecision(status, reason); setFeedback('Applicability saved. Prepare and Design progress updated.'); }
    catch (err) { setSaveError(err?.message || 'Unable to save applicability.'); }
    finally { setSaving(false); }
  };
  return <section aria-label="PD BR appointment applicability" className="rounded-xl border border-border bg-card p-4">
    <h4 className="text-sm font-semibold text-foreground">Appointments · PD BR applicability</h4>
    <p className="mt-1 text-xs text-muted-foreground">Legal can record whether Principal Designer Building Regulations applies to this project. Not applicable excludes it from Prepare and Design checks; it does not mark an appointment as signed.</p>
    {isPending ? <p role="status" className="mt-3 text-xs text-muted-foreground">Checking legal decision…</p> : error ? <p role="alert" className="mt-3 text-xs text-destructive">Unable to load applicability. <button type="button" className="underline" onClick={() => refetch()}>Retry</button></p> : <>
      <p className="mt-3 text-sm font-medium">Current: {decision?.applicability === 'not_applicable' ? 'Not applicable' : 'Required'}{!decision && ' (no legal decision recorded)'}</p>
      {decision && <div className="mt-1 text-xs text-muted-foreground"><p className="whitespace-pre-wrap">{decision.reason}</p><p className="mt-1">Recorded by {decision.recorded_by_name} · {formatDate(decision.created_date)}</p></div>}
      {canEdit ? <form onSubmit={save} className="mt-3 space-y-3">
        <label className="block text-xs font-medium">PD BR applicability<select disabled={saving} value={status} onChange={e => { setStatus(e.target.value); setFeedback(''); }} className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="required">Required</option><option value="not_applicable">Not applicable</option></select></label>
        <label className="block text-xs font-medium">Legal reason{status === 'required' && ' (optional)'}<textarea required={status === 'not_applicable'} maxLength={2000} disabled={saving} value={reason} onChange={e => { setReason(e.target.value); setFeedback(''); }} rows={3} placeholder="Record the legal basis for this decision" className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></label>
        <Button type="submit" size="sm" disabled={saving || (status === 'not_applicable' && !reason.trim())}>{saving ? 'Saving…' : 'Save applicability'}</Button>
        {saveError && <p role="alert" className="text-xs text-destructive">{saveError}</p>}{feedback && <p role="status" className="text-xs text-success">{feedback}</p>}
      </form> : <p className="mt-3 text-xs text-muted-foreground">Only legal administrators can record or change this decision.</p>}
    </>}
  </section>;
}