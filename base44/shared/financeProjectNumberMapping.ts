import {mainProjectNumber,projectNumberPattern,projectNumberPage} from './financeProjectNumberGroups.ts';
export async function readProjectNumberMappings(base44,state,input){
 const db=base44.entities;
 if(!['review','linked','all'].includes(input.status||'review')||String(input.cursor||'').length>8192)throw new Error('Invalid project-number filter.');
 const base={dataset_id:state.namespace},query={...base,source_code:{$exists:true,$nin:['',null]},...(input.status==='linked'?{status:{$in:['manual','automatic']}}:input.status==='all'?{}:{status:{$in:['unmatched','ambiguous']}})};
 const page=await projectNumberPage(db,query,input.cursor);
 const codes=page.items;if(!codes.length)return {...page,items:[]};
 const pattern={$regex:projectNumberPattern(codes),$options:'i'};
 const [groups,orders]=await Promise.all([
  db.FinanceProjectMapping.aggregate({query:{...base,source_code:pattern},groupBy:['source_code','project_id','source_name','status'],limit:1000}),
  db.FinanceDataverseRecord.aggregate({query:{namespace:state.namespace,generation:state.generation,kind:{$in:['purchase_orders','sales_orders']},project_code:pattern},groupBy:'project_code',limit:1000})
 ]);
 if(groups.truncated||orders.truncated)throw new Error('Too many source groups for this page.');
 const ids=[...new Set(groups.rows.map(r=>r.project_id).filter(Boolean))],projects=ids.length?(await db.Project.filter({id:{$in:ids}},{limit:1000,fields:['name','project_number']})).items:[];
 return {...page,items:codes.map(code=>{
  const rows=groups.rows.filter(r=>mainProjectNumber(r.source_code)===code),linked=rows.filter(r=>r.project_id),complete=linked.length>0&&rows.every(r=>r.project_id===linked[0].project_id),p=complete?projects.find(p=>p.id===linked[0].project_id):null;
  const status=complete?(rows.every(r=>r.status==='automatic')?'automatic':'manual'):linked.length?'ambiguous':'unmatched';
  return {source_key:code,source_code:code,source_name:[...new Set(rows.map(r=>r.source_name).filter(name=>typeof name==='string'&&name.trim()))].join(' / ')||`Project number ${code}`,code_group:true,status,project_id:p?.id||'',project_name:p?.name||'',project_code:p?.project_number||'',source_groups:rows.reduce((n,r)=>n+r.count,0),order_count:orders.rows.filter(r=>mainProjectNumber(r.project_code)===code).reduce((n,r)=>n+r.count,0),source_codes:[...new Set(rows.map(r=>r.source_code))]};
 })};
}
export async function saveProjectNumberMapping(base44,user,input,state){
 if(typeof input.sourceCode!=='string'||!input.sourceCode.trim()||input.sourceCode.length>250||typeof input.projectId!=='string'||input.projectId.length>100)throw new Error('Choose a project number and an existing project.');
 const db=base44.entities,base={dataset_id:state.namespace,source_code:{$regex:projectNumberPattern([input.sourceCode]),$options:'i'}};
 if(!await db.FinanceProjectMapping.count(base))throw new Error('This project number has no imported source groups.');
 const p=await db.Project.get(input.projectId);if(!p)throw new Error('Choose an existing project.');
 const values={project_id:p.id,project_name:p.name,project_code:p.project_number||'',status:'manual',matching_method:'manual',code_rule:true,linked_by:user.id,linked_at:new Date().toISOString()};
 let updated=0,result;
 do{result=await db.FinanceProjectMapping.updateMany({...base,$or:[{project_id:{$ne:p.id}},{status:{$ne:'manual'}},{code_rule:{$ne:true}},{project_name:{$ne:p.name}},{project_code:{$ne:p.project_number||''}}]},{$set:values});updated+=result.updated||0;}while(result.has_more);
 return {updated,notice:`Project number ${input.sourceCode} linked to ${p.name}. All matching PO/SO records use this link, including future imports. Original source codes are unchanged.`};
}
export async function savedProjectNumberRules(base44,dataset,codes){
 if(!dataset.startsWith('powerbi:')||!codes.length)return new Map();
 const grouped=await base44.asServiceRole.entities.FinanceProjectMapping.aggregate({query:{dataset_id:dataset,code_rule:true,status:'manual',source_code:{$regex:projectNumberPattern(codes),$options:'i'}},groupBy:['source_code','project_id','project_name','project_code'],limit:1000});
 if(grouped.truncated)throw new Error('Too many saved project-number rules.');
 const result=new Map();
 for(const row of grouped.rows){if(!row.project_id)continue;const code=mainProjectNumber(row.source_code);if(result.has(code)&&result.get(code).project_id!==row.project_id)throw new Error(`Conflicting saved links for project number ${code}. Review its mapping.`);result.set(code,{project_id:row.project_id,project_name:row.project_name,project_code:row.project_code,status:'manual',matching_method:'manual',code_rule:true});}
   return new Map(codes.filter(code=>result.has(mainProjectNumber(code))).map(code=>[code,result.get(mainProjectNumber(code))]));
}