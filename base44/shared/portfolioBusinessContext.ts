import {scopedReadCache} from './scopedReadCache.ts';
import {portfolioFinancialFigures} from './portfolioKeyFigures.ts';
import {projectValueAggregate} from './projectValueAggregate.ts';
const INTERNAL_ROLES=['admin','director','regional_director','bsm','finance','bdm'];
export async function portfolioBusinessContext(base44,user,now) {
  if(!INTERNAL_ROLES.includes(user.role))return null;
  // Explicitly authorised business-wide numeric context only. No records or IDs leave this helper.
  return scopedReadCache('portfolio-business-key-figures:v2',async()=>{
    const entities=base44.asServiceRole.entities;
    const query={$and:[{status:{$ne:'inactive'}},{dataverse_id:{$exists:true,$nin:[null,'']}},{$nor:[{approval_status:{$regex:'^\\s*(?:complete|completed)\\s*$',$options:'i'}},{practical_completion_date:{$gt:'',$lt:now}}]}]};
    const projects=await projectValueAggregate(entities,{query,groupBy:['id','live_project'],sum:'estimated_value',limit:1000});
    if(projects.truncated)throw new Error('Business-wide key figures exceeded their reporting limit.');
    const related={project_id:{$in:projects.rows.length ? projects.rows.map(row=>row.id) : ['000000000000000000000000']}};
    const actions=await entities.ProjectAction.aggregate({query:related,groupBy:['project_id','status','due_date','priority'],limit:1000});
    if(actions.truncated)throw new Error('Business-wide flag figures exceeded their reporting limit.');
    const financial=await portfolioFinancialFigures(entities,related,actions.rows,now);
    return {...financial,projects:projects.rows.reduce((n,row)=>n+row.count,0),live:projects.rows.filter(row=>row.live_project===true).reduce((n,row)=>n+row.count,0),value:projects.rows.reduce((n,row)=>n+(row.sum_estimated_value || 0),0)};
  });
}