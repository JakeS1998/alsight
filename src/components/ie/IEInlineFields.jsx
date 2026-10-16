import React from 'react';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {IE_STATUSES} from '@/components/ie/ieClient';
import IEScopeFields from '@/components/ie/IEScopeFields';
import IETeamFields from '@/components/ie/IETeamFields';
import IEInlineRecordFields from '@/components/ie/IEInlineRecordFields';
import IEInlineDateFields from '@/components/ie/IEInlineDateFields';
export default function IEInlineFields({section,value,set,previous,classifications,reason,setReason}){
 if(section==='records')return <IEInlineRecordFields value={value} set={set}/>;
 if(section==='team')return <IETeamFields value={value} set={set} editing/>;
 if(section==='dates')return <IEInlineDateFields value={value} set={set}/>;
 if(section==='notes')return <label className="block space-y-1 text-xs font-semibold">Important notes & risks<Textarea autoFocus maxLength={4000} rows={5} value={value.notes_risks||''} onChange={event=>set('notes_risks',event.target.value)}/></label>;
 const summary=section==='summary',imported=previous.origin?.startsWith('sharepoint:');
 const fields=summary?[...(imported?['product_id','support_type_id']:[]),'description','expected_outcome']:['service','product_id','support_type_id','region_id'];
 return <div className="space-y-4">
  <IETeamFields value={value} set={set} editing showTeam={false}/>
  <IEScopeFields value={value} set={set} classifications={classifications} fields={fields}/>
  {summary?<IEInlineDateFields value={value} set={set} summary/>:<>
   <div className="grid gap-4 sm:grid-cols-2">{[['status','Status',Object.entries(IE_STATUSES).map(([id,cfg])=>({id,name:cfg.label}))],['priority','Priority',['normal','high','urgent'].map(id=>({id,name:id.charAt(0).toUpperCase()+id.slice(1)}))]].map(([key,label,items])=><label key={key} className="space-y-1 text-xs font-semibold">{label}<select value={value[key]} onChange={event=>set(key,event.target.value)} className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm">{items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>)}</div>
   <label className="block space-y-1 text-xs font-semibold">Sites / facilities<Input value={(value.sites||[]).join('; ')} onChange={event=>set('sites',event.target.value.split(';'))} placeholder="Separate facilities with a semicolon"/></label>
   {previous.status==='completed'&&value.status!=='completed'&&<label className="block space-y-1 text-xs font-semibold">Reason for reopening *<Textarea required maxLength={1000} value={reason} onChange={event=>setReason(event.target.value)}/></label>}
  </>}
 </div>;
}