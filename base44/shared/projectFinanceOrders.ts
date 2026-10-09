import {readDataverseFinance} from './financeDataverseReads.ts';
import {projectOrderCashFlow} from './projectOrderCashFlow.ts';
export async function readProjectFinanceOrders(base44,state,input){
 if(!/^[a-f0-9]{24}$/i.test(input.projectId||''))throw new Error('Choose a valid project.');
 if(String(input.cursor||'').length>8192)throw new Error('Invalid order page.');
 // The caller's project permissions are checked before reading privileged finance records.
 const project=await base44.entities.Project.get(input.projectId);
 if(!project)throw new Error('Project not available.');
 if(!state?.active_generation)return input.action==='projectOrderCashFlow'?{entries:[],total:0,available:false}:{items:[],total:0,has_more:false,next_cursor:null,mappings:[]};
 const db=base44.asServiceRole.entities;
 const matches=await db.FinanceProjectMapping.filter({dataset_id:state.namespace,project_id:project.id,status:{$in:['automatic','manual']}},{limit:100,fields:['source_key','source_code','source_name','project_id','matching_method']});
 if(matches.has_more)throw new Error('Project finance links exceed the reporting limit.');
 const keys=matches.items.map(m=>m.source_key),base={generation:state.active_generation,namespace:state.namespace,active:true};
 if(input.action==='projectOrderDetail'){
  if(!/^[a-f0-9]{24}$/i.test(input.recordId||''))throw new Error('Choose a valid purchase order.');
  const record=await db.FinanceDataverseRecord.get(input.recordId);
  if(!record||record.kind!=='purchase_orders'||!record.active||record.generation!==state.active_generation||record.namespace!==state.namespace||!keys.includes(record.project_key))throw new Error('This purchase order is not linked to the selected project.');
  return readDataverseFinance({entities:db},state,{action:'dvDetail',recordId:record.id,cursor:input.cursor});
 }
 if(!keys.length)return input.action==='projectOrderCashFlow'?{entries:[],total:0,available:true}:{items:[],total:0,has_more:false,next_cursor:null,mappings:[],read_at:state.last_completed_at};
 const query={...base,kind:'purchase_orders',project_key:{$in:keys}};
 if(input.action==='projectOrderCashFlow')return projectOrderCashFlow(db,base,query);
 const [page,total]=await Promise.all([db.FinanceDataverseRecord.filter(query,{limit:50,sort:'reference',...(input.cursor?{cursor:input.cursor}:{})}),db.FinanceDataverseRecord.count(query)]);
 const ids=page.items.map(r=>r.source_id);
 const lines=ids.length?await db.FinanceDataverseRecord.aggregate({query:{...base,kind:'line_items',parent_id:{$in:ids}},groupBy:['parent_id','has_amount'],sum:'amount'}):{rows:[]};
 if(lines.truncated)throw new Error('Purchase-order line totals exceed the reporting limit.');
 const supplierIds=[...new Set(page.items.map(r=>r.supplier_source_id).filter(Boolean))];
 const suppliers=supplierIds.length?await db.FinanceDataverseRecord.filter({...base,kind:'suppliers',active:{$in:[true,false]},source_id:{$in:supplierIds}},{limit:100,fields:['source_id','name']}):{items:[]};
 const items=page.items.map(r=>{const valued=lines.rows.find(l=>l.parent_id===r.source_id&&l.has_amount),missing=lines.rows.find(l=>l.parent_id===r.source_id&&!l.has_amount)?.count||0;return {...r,supplier_name:suppliers.items.find(s=>s.source_id===r.supplier_source_id)?.name||'',display_net:r.has_amount?r.amount:valued&&!missing?valued.sum_amount:null,value_source:r.has_amount?'PO header':valued&&!missing?'Line items':'Unavailable',missing_line_values:missing};});
 return {...page,items,total,mappings:matches.items,read_at:state.last_completed_at};
}