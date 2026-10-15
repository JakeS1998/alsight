import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {useQueryClient} from '@tanstack/react-query';
import FrameworkKpiFormFields from '@/components/framework/FrameworkKpiFormFields';
import FrameworkPopulationImpact from '@/components/framework/FrameworkPopulationImpact';
import {SOCIAL_FIELDS,NUMBER_FIELDS,DATE_FIELDS,YES_NO_FIELDS} from '@/components/framework/frameworkKpiFields';

export default function UKLFKPIEditor({ report, defaults = {}, onSaved, onCancel, frameworkContext = false }) {
  const [form,setForm]=useState(()=>{const values={...defaults,...report};for(const [key,value] of Object.entries(defaults))if(values[key]==null || values[key]==='')values[key]=value;for(const [key] of DATE_FIELDS)values[key]=String(values[key] || '').slice(0,10);return values;});
  const cache=useQueryClient();
  const refresh=()=>['framework-workspace','framework-project-detail','framework-pathway-kpis','framework-kpi-summary'].forEach(key=>cache.invalidateQueries({queryKey:[key]}));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const save = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const { data } = await base44.functions.invoke('updateUKLFKpis', {
        reportId: report.id,
        frameworkContext,
        kpis: Object.fromEntries([
          ...[...NUMBER_FIELDS.map(([key])=>key),...SOCIAL_FIELDS.flatMap(([actual,target])=>[actual,target])].map(key=>[key,form[key]==null || form[key]==='' ? null : Number(form[key])]),
          ...[...DATE_FIELDS.map(([key])=>key),...YES_NO_FIELDS.map(([key])=>key),'high_level_evidence',...SOCIAL_FIELDS.map(([, , ,key])=>key).filter(Boolean)].map(key=>[key,form[key] || '']),
        ]),
      });
      if(data.error)throw new Error(data.error);
      refresh();onSaved(data.kpis);
    } catch(error) { setError(error.response?.data?.error || error.message || 'Unable to save KPIs.'); }
    finally { setSaving(false); }
  };
  return <form onSubmit={save} className="mt-5 space-y-4 border-t border-border pt-5">
    <p className="text-xs text-muted-foreground">Save progress at any time. Stage 10 stays incomplete until every KPI has an explicit value; No and zero are valid recorded results.</p>
    <FrameworkKpiFormFields form={form} set={set} disabled={saving}/>
    <FrameworkPopulationImpact report={form} canEdit onChanged={changes=>{setForm(previous=>({...previous,...changes}));refresh();}}/>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex gap-2"><button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? 'Saving…' : 'Save KPIs'}</button><button type="button" onClick={onCancel} disabled={saving} className="rounded-md border border-input px-4 py-2 text-sm font-medium">Cancel</button></div>
  </form>;
}