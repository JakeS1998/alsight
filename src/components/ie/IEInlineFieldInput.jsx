import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IE_STATUSES } from '@/components/ie/ieClient';
import IEScopeFields from '@/components/ie/IEScopeFields';
import IETeamFields from '@/components/ie/IETeamFields';
import IEInlineRecordFields from '@/components/ie/IEInlineRecordFields';

export default function IEInlineFieldInput({ field, value, set, previous, classifications, reason, setReason }) {
  const fields = Array.isArray(field) ? field : [field];
  if (fields.some(key => ['service','product_id','support_type_id','region_id','description','expected_outcome','notes_risks'].includes(key))) return <IEScopeFields value={value} set={set} classifications={classifications} fields={fields}/>;
  if (['owner_id','team_ids'].includes(field)) return <IETeamFields value={value} set={set} editing showOwner={field === 'owner_id'} showTeam={field === 'team_ids'}/>;
  if (['client_id','project_id','opportunity_id'].includes(field)) return <IEInlineRecordFields value={value} set={set} kinds={[field.replace('_id','')]}/>;
  if (['start_date','target_date','completion_date'].includes(field)) return <label className="block space-y-1 text-xs font-semibold">{({start_date:'Engagement start',target_date:'Target completion',completion_date:'Actual completion'})[field]}<Input type="date" required={field === 'completion_date' && value.status === 'completed'} disabled={field === 'completion_date' && value.status !== 'completed'} value={value[field] || ''} onChange={event => set(field,event.target.value)}/></label>;
  if (field === 'sites') return <label className="block space-y-1 text-xs font-semibold">Sites / facilities<Input value={(value.sites || []).join('; ')} onChange={event => set('sites',event.target.value.split(';'))} placeholder="Separate facilities with a semicolon"/></label>;
  const options = field === 'status' ? Object.entries(IE_STATUSES).map(([id,cfg]) => [id,cfg.label]) : ['normal','high','urgent'].map(id => [id,id.charAt(0).toUpperCase()+id.slice(1)]);
  return <div className="space-y-3"><label className="block space-y-1 text-xs font-semibold">{field === 'status' ? 'Status' : 'Priority'}<select className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm" value={value[field]} onChange={event => set(field,event.target.value)}>{options.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>
    {field === 'status' && previous.status === 'completed' && value.status !== 'completed' && <label className="block space-y-1 text-xs font-semibold">Reason for reopening *<Textarea required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)}/></label>}
  </div>;
}