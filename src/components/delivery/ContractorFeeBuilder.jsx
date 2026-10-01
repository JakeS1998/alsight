import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ContractorFeeImport from '@/components/delivery/ContractorFeeImport';

const SURVEY_STAGES = ['riba_1', 'riba_2', 'riba_3', 'riba_4'];
const STAGE_LABELS = { riba_1: 'RIBA 1', riba_2: 'RIBA 2', riba_3: 'RIBA 3', riba_4: 'RIBA 4', riba_5_7: 'RIBA 5-7' };

const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export default function ContractorFeeBuilder({ projectId, fees, onChange }) {
  const list = Array.isArray(fees) ? fees : [];

  const addSurvey = () => onChange([...list, { id: newId(), type: 'survey', stage: 'riba_1', amount: '' }]);
  const addConsultant = () => onChange([...list, { id: newId(), type: 'consultant', stage: 'riba_1', amount: '' }]);
  const addActivity = () => onChange([...list, { id: newId(), type: 'authorised_activity', stage: 'riba_5_7', amount: '' }]);
  const remove = (id) => onChange(list.filter((f) => f.id !== id));
  const update = (id, field, value) => onChange(list.map((f) => (f.id === id ? { ...f, [field]: value } : f)));

  return (
    <div className="space-y-2">
      <ContractorFeeImport projectId={projectId} onImport={rows => onChange([...list, ...rows])} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addSurvey}><Plus className="mr-1 h-4 w-4" /> Add survey</Button>
        <Button type="button" variant="outline" size="sm" onClick={addConsultant}><Plus className="mr-1 h-4 w-4" /> Add consultant</Button>
        <Button type="button" variant="outline" size="sm" onClick={addActivity}><Plus className="mr-1 h-4 w-4" /> Add authorised activity</Button>
      </div>
      {list.length === 0 ? (
        <p className="text-xs text-slate-500">Add surveys and consultants (RIBA 1-4), and authorised activities (RIBA 5-7) to build up the contractor fee.</p>
      ) : (
        <div className="space-y-2">
          {list.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${f.type === 'survey' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
                {f.type === 'survey' ? 'Survey' : f.type === 'consultant' ? 'Consultant' : 'Authorised activity'}
              </span>
              {f.type !== 'authorised_activity' ? (
                <select value={f.stage} onChange={(e) => update(f.id, 'stage', e.target.value)} className="h-8 rounded border border-input bg-background px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {SURVEY_STAGES.map((st) => <option key={st} value={st}>{STAGE_LABELS[st]}</option>)}
                </select>
              ) : (
                <span className="text-xs text-slate-500">{STAGE_LABELS[f.stage] || 'RIBA 5-7'}</span>
              )}
              <input type="text" value={f.supplier || ''} onChange={(e) => update(f.id, 'supplier', e.target.value)} placeholder="Supplier (optional)" className="h-8 min-w-[10rem] rounded border border-input bg-background px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input type="text" value={f.description || ''} onChange={(e) => update(f.id, 'description', e.target.value)} placeholder="Description (optional)" className="h-8 min-w-[12rem] flex-1 rounded border border-input bg-background px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <span className="text-xs text-slate-400">£</span>
              <input type="number" value={f.amount} onChange={(e) => update(f.id, 'amount', e.target.value)} placeholder="0" className="h-8 w-32 rounded border border-input bg-background px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button type="button" onClick={() => remove(f.id)} className="ml-auto rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}