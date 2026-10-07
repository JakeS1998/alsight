import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/portal';
export default function SupplierFsfSummary({ alsFee, fsfTotal, loading, error, onSave }) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const save = async () => {
    setSaving(true); setSaveError('');
    try { await onSave(); }
    catch (failure) { setSaveError(failure.message || 'Unable to save FSF rates.'); }
    finally { setSaving(false); }
  };
  return <div className="space-y-2 rounded-lg border border-border bg-primary/5 p-3">
    <p className="text-xs font-semibold text-muted-foreground">ALS INTERNAL ONLY · FSF is supplier-paid commission, not an extra client charge.</p>
    {error ? <p role="alert" className="text-sm text-destructive">Unable to load FSF rates; reload before saving or exporting.</p> : <div className="grid gap-3 sm:grid-cols-3">
      <div><p className="text-xs text-muted-foreground">ALS fee</p><p className="text-lg font-semibold">{formatCurrency(alsFee)}</p></div>
      <div><p className="text-xs text-muted-foreground">Supplier FSF commission</p><p className="text-lg font-semibold">{loading ? 'Loading…' : formatCurrency(fsfTotal)}</p></div>
      <div><p className="text-xs text-muted-foreground">Total ALS Value</p><p className="text-lg font-semibold">{loading ? 'Loading…' : formatCurrency(alsFee + fsfTotal)}</p></div>
    </div>}
    <p className="text-xs text-muted-foreground">FSF applies to each supplier’s full fees. Contractor fees include surveys, consultants, authorised activities and OHP. Save builder or save FSF rates to retain changes.</p>
    {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
    <Button type="button" variant="outline" size="sm" disabled={loading || !!error || saving} onClick={save}>{saving ? 'Saving…' : 'Save FSF rates'}</Button>
  </div>;
}