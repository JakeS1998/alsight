import React, {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import approvalClient from '@/components/approvals/approvalClient';
import ApprovalRoutingEditor from '@/components/approvals/ApprovalRoutingEditor.jsx';
import ApprovalRoutingPreview from '@/components/approvals/ApprovalRoutingPreview.jsx';
import ApprovalRoutingApply from '@/components/approvals/ApprovalRoutingApply.jsx';
export default function ApprovalRoutingAdmin() {
 const [active,setActive]=useState('documents'),[editing,setEditing]=useState(false),[notice,setNotice]=useState('');
 const status=useQuery({queryKey:['approval-routing'],retry:false,queryFn:()=>approvalClient('routingStatus')});
 if(status.isPending)return <p role="status" className="text-sm text-muted-foreground">Loading approval routes…</p>;
 if(status.isError)return <div><p role="alert" className="text-sm text-destructive">{status.error.message}</p><Button variant="outline" onClick={()=>status.refetch()}>Try again</Button></div>;
 const {rules,tables,relatedRules}=status.data,rule=rules.find(rule=>rule.table===active);
 const saved=message=>{setNotice(message);setEditing(false);status.refetch();};
 return <section className="space-y-4"><div><h2 className="font-heading text-xl font-semibold">Approval process mapping</h2><p className="mt-1 text-sm text-muted-foreground">Map each approval-enabled table to named individuals or contacts linked to its project. Rules are administrator-only; assigned requests remain private to each approver.</p><p className="mt-1 text-xs text-muted-foreground">Live responses require an internal portal account, approval access and the approver’s own Dataverse connection. The first confirmed response completes the source document; this is not a unanimous multi-signature process.</p></div>
  <div className="overflow-x-auto rounded-panel border border-border bg-card"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr>{['Table','Named individuals','Linked project contacts / owners','Status','Actions'].map(title=><th key={title} className="p-3 font-semibold">{title}</th>)}</tr></thead><tbody>{rules.map(row=><tr key={row.table} className="border-t border-border"><td className="p-3 font-semibold">{tables[row.table]}{row.inherited && <span className="mt-1 block text-xs font-normal text-muted-foreground">Existing default, not yet customised</span>}</td><td className="p-3">{row.named_emails.length ? row.named_emails.map(email=><span className="block" key={email}>{email}</span>) : 'None'}</td><td className="p-3">{row.related_rules.length ? row.related_rules.map(key=><span className="block" key={key}>{relatedRules[key]?.label}</span>) : 'None'}</td><td className="p-3">{row.enabled ? 'Enabled' : 'Disabled'}</td><td className="p-3"><div className="flex gap-2"><Button variant="outline" size="sm" onClick={()=>{setActive(row.table);setEditing(true);setNotice('');}}>Edit</Button><Button variant="ghost" size="sm" onClick={()=>{setActive(row.table);setEditing(false);setNotice('');}}>Check / apply</Button></div></td></tr>)}</tbody></table></div>
  {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
  {editing ? <ApprovalRoutingEditor key={`${active}:${rule.updated_date}`} rule={rule} title={tables[active]} relatedRules={relatedRules} onSaved={saved} onCancel={()=>setEditing(false)}/> : <><ApprovalRoutingPreview key={`preview:${active}`} table={active} title={tables[active]} revision={rule.updated_date}/><ApprovalRoutingApply key={`apply:${active}:${rule.updated_date}`} table={active} title={tables[active]}/></>}
 </section>;
}