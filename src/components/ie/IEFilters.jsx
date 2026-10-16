import React from 'react';
import {Search} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {IE_STATUSES} from '@/components/ie/ieClient';
import {regionName} from '@/components/ie/ieRegions';
import {IE_SERVICES} from '@/components/ie/ieServices';
export default function IEFilters({value,onChange,options={},classifications=[],actions}){
 const set=(key,val)=>onChange({...value,[key]:val});
 const fields=[['client_id','Client',options.clients||[]],['service','Service',Object.entries(IE_SERVICES).map(([id,name])=>({id,name}))],['product_id','Product',classifications.filter(c=>c.kind==='category')],['owner_id','SAM',options.people||[]],['support_type_id','Support type',classifications.filter(c=>c.kind==='support')],['region_id','Region',(options.regions||[]).map(id=>({id,name:regionName(id)}))],['context','Linked to',[{id:'standalone',name:'Standalone'},{id:'project',name:'Project-linked'},{id:'opportunity',name:'Opportunity-linked'}]]];
 return <div className="ie-toolbar"><div className="ie-filter-controls"><div className="ie-search"><Search aria-hidden="true"/><Input aria-label="Search engagements" placeholder="Search engagements…" value={value.search||''} onChange={e=>set('search',e.target.value)}/></div><select className="ie-filter-select" aria-label="Status" value={value.status||''} onChange={e=>set('status',e.target.value)}><option value="">Status</option>{Object.entries(IE_STATUSES).map(([id,cfg])=><option key={id} value={id}>{cfg.label}</option>)}</select>{fields.map(([key,label,items])=><select key={key} className="ie-filter-select" aria-label={label} value={value[key]||''} onChange={e=>set(key,e.target.value)}><option value="">{label}</option>{items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>)}<Button variant={value.mine?'secondary':'ghost'} size="sm" aria-pressed={!!value.mine} onClick={()=>set('mine',!value.mine)}>My assignments</Button><Button variant="ghost" size="sm" className="ie-clear" onClick={()=>onChange({})}>Clear filters</Button></div><div className="ie-toolbar-actions">{actions}</div></div>;
}