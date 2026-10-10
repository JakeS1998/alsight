export async function commercialPipelineSummary(base44) {
 const now=new Date().toISOString();
 const query={$and:[{status:{$ne:'inactive'}},{dataverse_id:{$exists:true,$nin:[null,'']}},{$nor:[{approval_status:{$regex:'^\\s*(?:complete|completed)\\s*$',$options:'i'}},{practical_completion_date:{$gt:'',$lt:now}}]}]};
 // User-scoped aggregation: the same project pipeline definition as Portfolio, with RLS enforced.
 const result=await base44.entities.Project.aggregate({query,sum:'full_value'});
 if(result.truncated)throw new Error('Pipeline totals are incomplete; partial figures are not displayed.');
 return {value:result.rows[0]?.sum_full_value||0,projects:result.rows[0]?.count||0,read_at:now};
}