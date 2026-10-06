import projectASERatingBuckets from './projectASERatingBuckets.ts';
export default async function projectASERatingReports(db,query) {
 const today=new Date().toISOString().slice(0,10);
 const identities=await db.Project.aggregate({query,groupBy:['id','dataverse_id','practical_completion_date'],limit:1000});
 if(identities.truncated)throw new Error('Narrow your project filters before selecting an ASE rating.');
 if(!identities.rows.length)return {attention:[],clear:[],unassessed:[]};
 const ids=identities.rows.map(p=>p.id),keys=[...new Set(identities.rows.flatMap(p=>[p.id,p.dataverse_id]).filter(Boolean))];
 const scope={project_id:{$in:ids}},related={project_id:{$in:keys}};
 const aggregate=(entity,query,groupBy,extra={})=>db[entity].aggregate({query,groupBy,limit:1000,...extra});
 const executed={$or:[{executed:{$in:['yes','po']}},{date_of_execution:{$exists:true,$nin:[null,'']}}]};
 const pending={$and:[{executed:{$nin:['yes','po']}},{$or:[{date_of_execution:{$exists:false}},{date_of_execution:{$in:[null,'']}}]}]};
 const distinct=(entity,query)=>db[entity].filter(query,{distinct:'project_id',limit:1000});
 const legal=async entity=>{const active={...related,$or:[{status:{$ne:'inactive'}},executed]};const [total,incomplete,due]=await Promise.all([distinct(entity,active),distinct(entity,{$and:[active,pending]}),distinct(entity,{$and:[related,{status:{$ne:'inactive'}},pending,{signing_target_date:{$lt:today,$nin:[null,'']}}]})]);return {total,incomplete,due};};
 const warranty={...related,status:{$ne:'inactive'},warranty_status:{$nin:['executed','product_warranty']},$or:[{date_of_execution:{$exists:false}},{date_of_execution:{$in:[null,'']}}]};
 const reports=await Promise.all([
  aggregate('ProjectDelivery',scope,['project_id','original_pc','forecast_pc','contract_sum'],{max:'updated_date',sort:'-max_updated_date'}),
  aggregate('ProjectDelivery',scope,['project_id','contract_start','pc_achieved'],{max:'updated_date',sort:'-max_updated_date'}),
  aggregate('ProjectDecision',scope,['project_id','status'],{sum:'financial_adjustment'}),
  aggregate('ProjectRisk',scope,['project_id','status'],{sum:'weighted_cost'}),
  ...['LegalDocument','DMA','JCT'].map(legal),
  Promise.all([distinct('Warranty',warranty),distinct('Warranty',{...warranty,warranty_due:{$lt:today,$nin:[null,'']}})]).then(([outstanding,due])=>({outstanding,due})),
  distinct('ProjectAction',{...scope,status:{$in:['open','in_progress']},due_date:{$lt:today,$nin:[null,'']}}),
  distinct('Valuation',{...scope,payment_due_date:{$lt:today,$nin:[null,'']},status:{$nin:['paid','rejected']}}),
 ]);
 if(reports.some(r=>r.truncated || r.has_more || Object.values(r).some(p=>p?.has_more)))throw new Error('Narrow your project filters before selecting an ASE rating.');
 return projectASERatingBuckets(identities.rows,reports,today);
}