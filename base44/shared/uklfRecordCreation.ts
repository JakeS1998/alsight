import {projectAliases,referenceAliases,namePattern,newUKLFRecord,uklfCopiedMilestones} from './uklfRecordValues.ts';
import {invalidateScopedRead} from './scopedReadCache.ts';
const normal=value=>String(value || '').trim().replace(/\s+/g,' ').toLowerCase();
export async function createMissingUKLFRecords(base44,projects,assertLease) {
 const eligible=projects.filter(p=>p.procurement_route===true),db=base44.entities;if(!eligible.length)return {created:0,reused:0,conflicts:[]};
 const ids=eligible.flatMap(projectAliases),numbers=eligible.map(p=>p.project_number).filter(Boolean),refs=eligible.flatMap(referenceAliases);
 const query={$or:[{project_id:{$in:ids}},{project_number:{$in:numbers}},{framework_ref:{$in:refs}},...eligible.filter(p=>p.name).map(p=>({site:{$regex:namePattern(p.name),$options:'i'}}))]};
 const page=await db.FrameworkProjectReport.filter(query,{limit:500});if(page.has_more)throw new Error('Too many matching UKLF records. Narrow the batch before continuing.');
 const reports=page.items,create=[],links=[],conflicts=[];let reused=0;
 for(const project of eligible){
  const aliases=projectAliases(project),references=referenceAliases(project),sameName=row=>normal(row.site)===normal(project.name);
  const linked=reports.filter(r=>aliases.includes(r.project_id));if(linked.length){reused++;continue;}
  const candidates=reports.filter(r=>!r.project_id && ((project.project_number && r.project_number===project.project_number) || references.includes(r.framework_ref) || (project.name && sameName(r))));
  if(candidates.length>1){conflicts.push({project_id:project.id,project_number:project.project_number,name:project.name,reason:'Existing references are ambiguous or linked to another project. Link manually in Framework360.'});continue;}
  const match=candidates[0];
  if(match && !sameName(match) && project.project_number){
   const count=await db.Project.count({procurement_route:true,project_number:project.project_number});
   if(count!==1){conflicts.push({project_id:project.id,name:project.name,reason:'This legacy code belongs to multiple Framework projects. Link manually in Framework360.'});continue;}
  }
  if(match && sameName(match) && match.project_number!==project.project_number && !references.includes(match.framework_ref)){
   const count=await db.Project.count({procurement_route:true,name:{$regex:namePattern(project.name),$options:'i'}});
   if(count!==1){conflicts.push({project_id:project.id,name:project.name,reason:'More than one Framework project has this name. Link manually in Framework360.'});continue;}
  }
  if(match){links.push({id:match.id,project_id:project.id,...(!match.project_number && project.project_number ? {project_number:project.project_number} : {})});match.project_id=project.id;reused++;}
  else create.push(project);
 }
 const milestones=create.length ? await uklfCopiedMilestones(db,create) : new Map();
 await assertLease();
 if(links.length)await db.FrameworkProjectReport.bulkUpdate(links);
 if(create.length)await db.FrameworkProjectReport.upsert(create.map(p=>newUKLFRecord(p,milestones)),{key:'project_id'});
 invalidateScopedRead('framework:');
 return {created:create.length,reused,conflicts};
}