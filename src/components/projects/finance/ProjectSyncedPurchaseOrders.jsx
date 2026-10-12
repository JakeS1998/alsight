import React,{useState} from 'react';
import {Button} from '@/components/ui/button';
import {formatCurrency,formatDate} from '@/lib/portal';
import FinanceDataverseDetail from '@/components/finance/FinanceDataverseDetail';
import FinanceNameMatchFlag from '@/components/finance/FinanceNameMatchFlag.jsx';
import OrderMappedDate from '@/components/finance/OrderMappedDate';
export default function ProjectSyncedPurchaseOrders({project,orders,type='PO'}){
 const [selected,setSelected]=useState(null),data=orders.data;
 return <section className="space-y-4 rounded-panel border border-border bg-card p-5">
  <div><h3 className="font-heading text-base font-semibold">{type==='SO'?'Invoices (Sales Orders)':'Purchase Orders'}</h3><p className="mt-1 text-sm text-muted-foreground">{data.total} linked {type==='SO'?'client invoices':'purchase orders'} · Power BI semantic model</p>
   {data.mappings.map(m=><div key={m.source_key} className="mt-1 text-xs text-muted-foreground">Finance reference: {m.source_code} · Legal project: {project.project_number}<FinanceNameMatchFlag mapping={m}/></div>)}
  </div>
  <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr>{[type==='SO'?'Invoice':'Purchase order',type==='SO'?'Client':'Supplier','Date','Model value','Approval',''].map((label,index)=><th key={index} className="p-3">{label}</th>)}</tr></thead>
   <tbody>{data.items.map(po=><tr className="border-t border-border" key={po.id}><td className="p-3 font-medium">{po.reference}</td><td className="p-3">{type==='SO'?(project.client_name||'Client not recorded'):(po.supplier_name||'Not linked / unavailable')}</td><td className="p-3"><OrderMappedDate record={po}/></td><td className="p-3">{po.display_net==null?'Not available':formatCurrency(po.display_net)}{po.value_source==='Line items'&&<p className="text-xs text-muted-foreground">From line items</p>}{po.missing_line_values>0&&<p className="text-xs text-destructive">Missing line values</p>}</td><td className="p-3">{po.approval||'Not recorded'}</td><td className="p-3"><Button variant="outline" onClick={()=>setSelected(po.id)}>View detail</Button></td></tr>)}</tbody>
  </table>{!data.items.length&&<p className="p-4 text-sm text-muted-foreground">No Power BI {type==='SO'?'client invoices':'purchase orders'} are linked to this project. Projects without a Power BI match require mapping review.</p>}</div>
  <div className="flex gap-2">{orders.cursor&&<Button variant="outline" disabled={orders.isFetching} onClick={()=>{orders.setCursor(null);setSelected(null);}}>First orders</Button>}{data.has_more&&<Button variant="outline" disabled={orders.isFetching} onClick={()=>{orders.setCursor(data.next_cursor);setSelected(null);}}>Next orders</Button>}</div>
  {orders.isFetching&&<p role="status" className="text-sm text-muted-foreground">Refreshing {type==='SO'?'client invoices':'purchase orders'}…</p>}
  {selected&&<FinanceDataverseDetail key={selected} projectId={project.id} clientName={project.client_name} recordId={selected} onClose={()=>setSelected(null)}/>}
 </section>;
}