import {financePOCommitments} from './financePOCommitments.ts';
const labels={projects:'Finance projects',suppliers:'Suppliers',customers:'Customers',purchase_orders:'Purchase orders',line_items:'PO line items',invoices:'Sales invoices'};
export async function financeDashboardSummary(base44,state,base){
 const db=base44.entities;
 const grouped=await db.FinanceDataverseRecord.aggregate({query:base,groupBy:['kind','source_table','has_amount'],sum:'amount'});
 if(grouped.truncated)throw new Error('Finance coverage exceeded the grouping limit. Partial figures are not displayed.');
 const amounts=[];
 for(const row of grouped.rows){let total=amounts.find(r=>r.kind===row.kind&&r.has_amount===row.has_amount);if(!total){total={kind:row.kind,has_amount:row.has_amount,count:0,sum_amount:0};amounts.push(total);}total.count+=row.count;total.sum_amount+=row.sum_amount||0;}
 const matches=await db.FinanceProjectMapping.aggregate({query:{dataset_id:state.namespace},groupBy:'status'});
 const gaps=await db.FinanceDataverseRecord.aggregate({query:{...base,$or:[{kind:{$in:['purchase_orders','invoices']},project_key:{$in:['',null]}},{kind:'line_items',parent_id:{$in:['',null]}}]},groupBy:'kind'});
 const hasPO=amounts.some(r=>r.kind==='purchase_orders'&&r.has_amount&&r.count>0),topKind=hasPO?'purchase_orders':'line_items';
 const top=await db.FinanceDataverseRecord.aggregate({query:{...base,kind:topKind,has_amount:true},groupBy:hasPO?['project_key','project_name']:'parent_id',sum:'amount',sort:'-sum_amount',limit:8});
 if(!hasPO&&top.rows.length){const ids=top.rows.map(r=>r.parent_id).filter(Boolean),pos=ids.length?(await db.FinanceDataverseRecord.filter({...base,kind:'purchase_orders',source_id:{$in:ids}},{limit:8,fields:['source_id','reference','project_name']})).items:[];for(const r of top.rows){const po=pos.find(p=>p.source_id===r.parent_id);r.project_name=po?`${po.reference}${po.project_name?' · '+po.project_name:''}`:'PO lookup missing';}}
 const current=state.generation===state.active_generation;
 const coverage=(current?state.tables?.list||[]:[]).map(t=>{const rows=grouped.rows.filter(r=>r.source_table===t.logical&&r.kind===t.kind),active=rows.reduce((n,r)=>n+r.count,0),valued=rows.filter(r=>r.has_amount).reduce((n,r)=>n+r.count,0);return {logical:t.logical,kind:t.kind,label:t.label||labels[t.kind],imported:t.processed||0,active,valued,missing:active-valued,amount_mapped:Boolean(t.fields?.amount),financial:['purchase_orders','line_items','invoices'].includes(t.kind)};});
 const poCommitments=await financePOCommitments(db,base,amounts);
 return {po_commitments:poCommitments,amounts,matches:matches.rows,gaps:gaps.rows,top:top.rows,top_kind:topKind,coverage,coverage_pending:!current,read_at:state.last_completed_at,invoices_have_values:amounts.some(r=>r.kind==='invoices'&&r.has_amount&&r.count>0),source:'Completed Dataverse snapshot. Active records only. Net amounts exclude VAT; PO headers and line-item costs are separate views and must not be added together.'};
}