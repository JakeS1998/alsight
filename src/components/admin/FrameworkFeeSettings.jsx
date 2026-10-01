import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/portal';
import useFrameworkFees from '@/components/delivery/useFrameworkFees';

const bandLabel = (band, index, total) => {
  const min = Number(band.min) || 0;
  const max = Number(band.max) || 0;
  const isTop = !max || max <= min || index === total - 1;
  if (isTop) return `£${min.toLocaleString('en-GB')}+`;
  return `£${min.toLocaleString('en-GB')} – £${max.toLocaleString('en-GB')}`;
};

export default function FrameworkFeeSettings() {
  const { settings, loading, error, reload } = useFrameworkFees();
  const { user } = useAuth();
  const [bands, setBands] = useState([]);
  const [contingency, setContingency] = useState('');
  const [uklf, setUklf] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (settings) {
      setBands(settings.bands.map(b => ({ ...b, min: String(b.min ?? 0), max: String(b.max ?? 0), pct: String(b.pct ?? 0) })));
      setContingency(settings.contingency || 'Contingency');
      setUklf(settings.uklf || 'UKLF Fee');
    }
  }, [settings]);

  const updateBand = (index, field, value) => setBands(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  const addBand = () => setBands(prev => [...prev, { min: '0', max: '0', pct: '0' }]);
  const removeBand = (index) => setBands(prev => prev.filter((_, i) => i !== index));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true); setSaveError(''); setSaved(false);
    try {
      const cleaned = bands
        .map(b => ({
          min: Math.max(0, Number(b.min) || 0),
          max: Math.max(0, Number(b.max) || 0),
          pct: Math.min(100, Math.max(0, Number(b.pct) || 0)),
        }))
        .filter(b => !Number.isNaN(b.min))
        .sort((a, b) => a.min - b.min);
      if (!cleaned.length) throw new Error('Add at least one fee band.');
      const payload = {
        key: 'uklf-fee-bands',
        bands: cleaned,
        contingency_label: contingency.trim() || 'Contingency',
        uklf_label: uklf.trim() || 'UKLF Fee',
        updated_by: user?.id || '',
        updated_at: new Date().toISOString(),
      };
      if (settings?.id) await base44.entities.FrameworkFeeSettings.update(settings.id, payload);
      else await base44.entities.FrameworkFeeSettings.create(payload);
      setSaved(true);
      reload();
      setTimeout(() => setSaved(false), 4000);
    } catch (failure) {
      setSaveError(failure.message || 'Unable to save framework fee settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-primary" /></div>;
  if (error && !settings) return <p role="alert" className="text-sm text-destructive">{error} <button type="button" onClick={reload} className="underline">Try again</button></p>;

  return <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="framework-fee-heading">
    <h2 id="framework-fee-heading" className="text-lg font-semibold">UKLF framework fee bands</h2>
    <p className="mt-1 text-sm text-muted-foreground">The framework fee is a percentage of the total contract value, excluding the UKLF fee and contingency. Bands are matched to the contract value and applied automatically in the fee proposal builder.</p>
    <form onSubmit={save} className="mt-4 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">UKLF fee line label</label>
          <input value={uklf} onChange={e => setUklf(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" placeholder="UKLF Fee" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contingency line label</label>
          <input value={contingency} onChange={e => setContingency(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" placeholder="Contingency" />
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5">Band</th>
              <th className="px-3 py-2.5 text-right">Min (£)</th>
              <th className="px-3 py-2.5 text-right">Max (£)</th>
              <th className="px-3 py-2.5 text-right">Fee %</th>
              <th className="px-3 py-2.5 text-right">Example fee</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bands.map((band, index) => {
              const example = Math.round((Number(band.min) || 0) * (Number(band.pct) || 0) / 100);
              return <tr key={index}>
                <td className="px-3 py-2 text-muted-foreground">{bandLabel(band, index, bands.length)}</td>
                <td className="px-3 py-2"><input type="number" min="0" step="1" value={band.min} onChange={e => updateBand(index, 'min', e.target.value)} className="h-8 w-32 rounded border border-input bg-background px-2 text-right text-sm" /></td>
                <td className="px-3 py-2"><input type="number" min="0" step="1" value={band.max} onChange={e => updateBand(index, 'max', e.target.value)} className="h-8 w-32 rounded border border-input bg-background px-2 text-right text-sm" /></td>
                <td className="px-3 py-2"><input type="number" min="0" max="100" step="0.01" value={band.pct} onChange={e => updateBand(index, 'pct', e.target.value)} className="h-8 w-20 rounded border border-input bg-background px-2 text-right text-sm" /></td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatCurrency(example)}</td>
                <td className="px-3 py-2 text-right"><button type="button" onClick={() => removeBand(index)} aria-label={`Remove band ${index + 1}`} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={addBand} className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><Plus className="h-4 w-4" /> Add band</button>
      {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
      {saved && <p role="status" className="text-sm text-success">Framework fee bands saved. New fee proposals will use the updated rates.</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save fee bands</Button>
      </div>
      <p className="text-xs text-muted-foreground">Leave the top band's Max at 0 to indicate an open-ended range (£value+). Bands are sorted by minimum value when saved.</p>
    </form>
  </section>;
}