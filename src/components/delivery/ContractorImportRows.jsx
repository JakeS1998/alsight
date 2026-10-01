import React from 'react';
const types = { survey: 'Survey', consultant: 'Consultant', authorised_activity: 'Authorised activity' };
const stages = { riba_1: 'RIBA 1', riba_2: 'RIBA 2', riba_3: 'RIBA 3', riba_4: 'RIBA 4', riba_5_7: 'RIBA 5–7' };
const inputClass = 'h-9 w-full rounded border border-input bg-background px-2 text-sm';
export default function ContractorImportRows({ rows, setRows }) {
  const update = (id, key, value) => setRows(old => old.map(row => {
    if (row.id !== id) return row;
    const next = { ...row, [key]: value };
    if (key === 'type') next.stage = value === 'authorised_activity' ? 'riba_5_7' : row.stage === 'riba_5_7' ? '' : row.stage;
    return next;
  }));
  return <div className="max-h-[50vh] space-y-3 overflow-y-auto">
    {rows.map((row, index) => <div key={row.id} className="rounded-lg border border-border bg-muted/20 p-3">
      <label className="mb-2 flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={row.selected} onChange={e => update(row.id, 'selected', e.target.checked)} />Line {index + 1}</label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs">Category<select aria-label={`Category for line ${index + 1}`} value={row.type} onChange={e => update(row.id, 'type', e.target.value)} className={inputClass}><option value="">Select category</option>{Object.entries(types).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="text-xs">Stage<select aria-label={`Stage for line ${index + 1}`} value={row.stage} onChange={e => update(row.id, 'stage', e.target.value)} className={inputClass}><option value="">Select stage</option>{Object.entries(stages).filter(([key]) => row.type === 'authorised_activity' ? key === 'riba_5_7' : key !== 'riba_5_7').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="text-xs">Supplier<input value={row.supplier} onChange={e => update(row.id, 'supplier', e.target.value)} className={inputClass} /></label>
        <label className="text-xs">Base fee (£)<input type="number" min="0" step="0.01" value={row.amount} onChange={e => update(row.id, 'amount', e.target.value)} className={inputClass} /></label>
        <label className="text-xs sm:col-span-2">Description<textarea value={row.description} onChange={e => update(row.id, 'description', e.target.value)} className="w-full rounded border border-input bg-background px-2 py-2 text-sm" rows={2} /></label>
      </div>
    </div>)}
  </div>;
}