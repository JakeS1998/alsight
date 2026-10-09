export async function reconcileOrders(base44,type,rows,mapping){
 if(type==='SO')return rows.map(r=>({...r,issues:[...(r.Missing?['Missing Power BI net values']:[]),'Sales invoices are shown separately; invoice references are not assumed to equal SO references.']}));
 const db=base44.entities,refs=rows.map(r=>r.Reference).filter(Boolean);
 const page=refs.length?await db.PurchaseOrder.filter({po_number:{$in:refs}},{limit:200}):{items:[],has_more:false};
 const numbers=[...new Set(page.items.map(p=>p.supplier_company_number).filter(Boolean))];
 const accounts=numbers.length?(await db.Account.filter({company_number:{$in:numbers}},{limit:200,fields:['name','company_number','dataverse_id']})).items:[];
 return rows.map(row=>{
 const matches=page.items.filter(p=>p.po_number===row.Reference),po=matches.length===1?matches[0]:null,issues=[];
 if(row.Missing)issues.push('Missing Power BI net values');
 if(!row.Reference)issues.push('Missing order reference');
 if(matches.length!==1)issues.push(matches.length?'Ambiguous Dataverse PO reference':'No synced Dataverse PO found');
 if(po&&!po.dataverse_id)issues.push('PO has no Dataverse identity; source unverified');
 if(po&&po.total_net_value==null)issues.push('Dataverse PO net value missing');
 if(po&&row.Value!=null&&po.total_net_value!=null&&Math.abs(Number(row.Value)-Number(po.total_net_value))>0.01)issues.push('Net-value discrepancy');
 if(po?.legal_project_id&&mapping.project_id&&po.legal_project_id!==mapping.project_id)issues.push('Project-link discrepancy');
 if(page.has_more)issues.push('Dataverse lookup exceeded its result limit; reconciliation is incomplete');
 const suppliers=po?accounts.filter(a=>a.company_number===po.supplier_company_number):[];
 if(po&&suppliers.length!==1)issues.push(suppliers.length?'Ambiguous supplier':'Supplier detail unavailable');
 return {...row,po:po?{id:po.id,po_number:po.po_number,total_net_value:po.total_net_value,dataverse_id:po.dataverse_id,updated_date:po.updated_date,project_ref:po.project_ref}:null,supplier:suppliers.length===1?suppliers[0].name:null,issues};
 });
}
export async function financePODetail(base44,input){
 const p=await base44.entities.PurchaseOrder.get(input.poId);if(!p)throw new Error('Purchase order not found.');
 const aliases=[p.id,p.dataverse_id].filter(Boolean);
 const lines=await base44.entities.PurchaseOrderLineItem.filter({po_id:{$in:aliases}},{limit:50,sort:'name',...(input.cursor?{cursor:input.cursor}:{})});
 const totals=await base44.entities.PurchaseOrderLineItem.aggregate({query:{po_id:{$in:aliases}},sum:'net_value'});
 return {po:p,lines,total:totals.rows[0]||null,source:'Synced Dataverse records in ALSight. Last saved timestamps are shown; this is not a live Dataverse refresh.'};
}