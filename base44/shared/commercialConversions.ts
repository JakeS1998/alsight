import {commercialAccessScope,commercialRoles} from './commercialAccessScope.ts';
export async function commercialConversions(base44,user){
 if(!commercialRoles.includes(user.role)){const error=new Error('Commercial reporting access required.');error.status=403;throw error;}
 const scope=await commercialAccessScope(base44,user,null);
 const projects=scope.client.entities.Project,db=base44.asServiceRole.entities;
 const closureQuery={status:'confirmed',...(scope.restricted?{project_id:{$in:scope.projectIds}}:{})};
 const opportunity=scope.restricted?base44.entities.Opportunity:db.Opportunity;
 const completed={practical_completion_date:{$exists:true,$nin:[null,''],$lte:new Date().toISOString()}};
 const [totalProjects,completedProjects,totalOpportunities,convertedOpportunities,reasons]=await Promise.all([
  projects.count(),projects.count(completed),opportunity.count(),opportunity.count({project_id:{$exists:true,$nin:[null,'']}}),
  db.ProjectClosure.aggregate({query:closureQuery,groupBy:'reason'})
 ]);
 return {totalProjects,completedProjects,totalOpportunities,convertedOpportunities,reasons:reasons.rows,opportunityRate:totalOpportunities?convertedOpportunities/totalOpportunities*100:null,completionRate:totalProjects?completedProjects/totalProjects*100:null};
}