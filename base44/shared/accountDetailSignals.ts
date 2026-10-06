import {recordIds} from './recordIds.ts';
import {aseCurrentRatings} from './aseCurrentRatings.ts';
export async function accountDetailSignals(base44,accountId,internal,visibleMoney,portfolioReports=null) {
 const rawAccount=await base44.entities.Account.get(accountId);
 if(!rawAccount)return {items:[],total:0,next_cursor:null,has_more:false};
 const keys=[...new Set([rawAccount.id,rawAccount.dataverse_id].filter(Boolean))];
 const scope={account_id:{$in:keys}};
 const [legal,warranties,contracts]=await Promise.all([
  base44.entities.LegalDocument.filter({$or:[{account_id:{$in:keys}},{client_account_id:{$in:keys}}]},{distinct:'project_id',limit:1000}),
  base44.entities.Warranty.filter({$or:[{account_id:{$in:keys}},{supplier_id:{$in:keys}},{client_account_id:{$in:keys}}]},{distinct:'project_id',limit:1000}),
  base44.entities.JCT.filter({$or:[{account_id:{$in:keys}},{contractor_id:{$in:keys}},{client_account_id:{$in:keys}}]},{distinct:'project_id',limit:1000})
 ]);
 if([legal,warranties,contracts].some(page=>page.has_more))throw Object.assign(new Error('Organisation project links exceed the reporting limit.'),{status:422});
 const projectIds=[...new Set([...legal.items,...warranties.items,...contracts.items].filter(Boolean))];
 const projectRecordIds=recordIds(projectIds);
 const related={$or:[{client_account_id:{$in:keys}},{account_id:{$in:keys}},...(projectRecordIds.length ? [{id:{$in:projectRecordIds}}] : []),...(projectIds.length ? [{dataverse_id:{$in:projectIds}}] : [])]};
 const live={status:{$ne:'inactive'},live_project:true,approval_status:{$nin:['complete','completed']},$or:[{practical_completion_date:{$exists:false}},{practical_completion_date:{$in:[null,'']}},{practical_completion_date:{$gte:new Date().toISOString()}}]};
 const [projects,openOpportunities,activity,conversation,owners,ratings]=await Promise.all([
  portfolioReports ? Promise.resolve({rows:[portfolioReports[0].rows.filter(row=>keys.includes(row.client_account_id) || keys.includes(row.account_id) || projectIds.includes(row.id) || projectIds.includes(row.dataverse_id)).reduce((total,row)=>({count:total.count+row.count,...(visibleMoney ? {sum_estimated_value:total.sum_estimated_value+(row.sum_estimated_value || 0)} : {})}),{count:0,...(visibleMoney ? {sum_estimated_value:0} : {})})]}) : base44.entities.Project.aggregate({query:{$and:[live,related]},...(visibleMoney ? {sum:'estimated_value'} : {})}),
  base44.entities.Opportunity.count({...scope,status:'open'}),
  base44.entities.CRMActivity.filter(scope,{sort:'-occurred_at',limit:1,fields:['occurred_at']}),
  base44.entities.Conversation.filter(scope,{sort:'-occurred_at',limit:1,fields:['occurred_at']}),
  rawAccount.account_manager_aad_id ? base44.entities.Contact.filter({$or:[{aad_id:rawAccount.account_manager_aad_id},{dataverse_id:rawAccount.account_manager_aad_id},...(recordIds([rawAccount.account_manager_aad_id]).length ? [{id:rawAccount.account_manager_aad_id}] : [])]},{limit:1,fields:['full_name']}) : {items:[]},
  internal ? aseCurrentRatings(base44.entities,[rawAccount.id]) : []
 ]);
 const {ase_score,ase_reason,ase_assessed_at,...safeAccount}=rawAccount;
 const account=internal ? {...safeAccount,_ase:ratings[0] || null} : safeAccount;
 const latest=[activity.items[0]?.occurred_at,conversation.items[0]?.occurred_at].filter(Boolean).sort().at(-1) || null;
 const total=projects.rows[0];
 return {items:[{account,signals:{activeProjects:total?.count || 0,openOpportunities,...(visibleMoney ? {liveValue:total?.sum_estimated_value || 0} : {}),lastInteraction:latest,owner:owners.items[0]?.full_name || (rawAccount.account_manager_aad_id ? 'Assigned owner' : 'Not assigned')}}],total:1,next_cursor:null,has_more:false};
}