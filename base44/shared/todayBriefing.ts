import { approvalList, approvalSummary } from './documentApprovalReads.ts';
import { todayDocumentBriefing } from './todayDocumentBriefing.ts';
export async function todayBriefing(base44, projectIds, user) {
 const db=base44.entities, now=new Date(), day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const roles=[...new Set([user.role,...(user.duty_roles || user.data?.duty_roles || [])])],documentFocused=roles.includes('bsm'),includeProjectDates=!documentFocused || roles.includes('bdm');
 const identities=[user.id,user.staff_aad_id,user.data?.staff_aad_id,user.dataverse_systemuser_id,user.data?.dataverse_systemuser_id,user.delegate_of,user.data?.delegate_of].filter(Boolean);
 if(roles.some(role=>['bsm','bdm'].includes(role)) && user.email) {const page=await db.Contact.filter({email:{$regex:`^${user.email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,$options:'i'}},{limit:1,fields:['aad_id']});if(page.items[0]?.aad_id)identities.push(page.items[0].aad_id);}
 const scope=user.role==='bsm' ? {bsm_aad_id:{$in:identities}} : user.role==='bdm' ? {$or:[{bdm_aad_id:{$in:identities}},{bsm_aad_id:{$in:identities}}]} : user.role==='regional_director' ? {department_id:user.region || user.data?.region || '__unassigned_region__'} : {};
 const projects=await db.Project.filter({id:{$in:projectIds},status:{$ne:'inactive'},...scope},{distinct:'id',limit:2000});
 if(projects.has_more)throw new Error('Portfolio exceeds the daily briefing limit.');
 const selected={id:{$in:projects.items}}, related={project_id:{$in:projects.items}};
 const riskQuery={...related,status:'open',$or:[{risk_index:{$gte:15}},{risk_index:{$exists:false},rag:'red'},{risk_index:null,rag:'red'}]};
 const decisionsQuery={...related,status:'open',required_by:{$regex:'\\S',$lt:day}};
 const proposalQuery={...related,is_current:true,status:{$in:['sent','negotiation']},$or:[{client_approval_date:{$exists:false}},{client_approval_date:null},{client_approval_date:''}]};
 const end=new Date(now.getTime()+14*86400000).toISOString().slice(0,10);
 const dateFields=['riba1_end','riba2_end','riba3_end','riba4_end','practical_completion_date'];
 const datesQuery={...selected,live_project:true,$or:dateFields.map(field=>({[field]:{$gte:day,$lt:`${end}T23:59:59.999Z`}}))};
 const documents=documentFocused ? await todayDocumentBriefing(base44,[...new Set(identities)],day,end) : {items:[],totals:{drafting:0,signing:0}};
 const [risks,decisions,proposals,dates,approvals]=await Promise.all([
  (async()=>({total:await db.ProjectRisk.count(riskQuery),groups:(await db.ProjectRisk.aggregate({query:riskQuery,groupBy:'project_id',sort:'-count',limit:3})).rows}))(),
  (async()=>({total:await db.ProjectDecision.count(decisionsQuery),page:await db.ProjectDecision.filter(decisionsQuery,{sort:'required_by',limit:3,fields:['project_id','decision_title','required_by']})}))(),
  (async()=>({total:await db.FeeProposal.count(proposalQuery),page:await db.FeeProposal.filter(proposalQuery,{sort:'date_issued',limit:3,fields:['project_id','date_issued','status']})}))(),
  includeProjectDates ? (async()=>({total:await db.Project.count(datesQuery),page:await db.Project.filter(datesQuery,{sort:'name',limit:3,fields:['name',...dateFields]})}))() : Promise.resolve({total:0,page:{items:[]}}),
  (async()=>({total:(await approvalSummary(base44,user)).pending,page:await approvalList(base44,user,{view:'pending',limit:3})}))()
 ]);
 const ids=[...new Set([...risks.groups.map(r=>r.project_id),...decisions.page.items.map(r=>r.project_id),...proposals.page.items.map(r=>r.project_id)])];
 const names=ids.length ? (await db.Project.filter({id:{$in:ids}},{limit:9,fields:['name','client_account_id','bdm_aad_id']})).items : [];
 const project=id=>names.find(p=>p.id===id),link=(id,stage)=>`/projects/${id}?tab=delivery&stage=${stage}`;
 const items=[
  ...documents.items,
  ...risks.groups.map(r=>({key:`risk-${r.project_id}`,severity:'urgent',project:project(r.project_id),title:project(r.project_id)?.name || 'Project',detail:`${r.count} high-risk ${r.count===1?'item':'items'}`,to:link(r.project_id,8),label:'Review risks',task:'action'})),
  ...decisions.page.items.map(r=>({key:`decision-${r.id}`,severity:'attention',project:project(r.project_id),title:project(r.project_id)?.name || 'Project',detail:`Overdue decision: ${r.decision_title} (required ${r.required_by})`,to:link(r.project_id,7),label:'Record decision'})),
  ...approvals.page.items.map(r=>({key:`approval-${r.id}`,severity:'attention',title:r.project_name || r.document_title,detail:`Approval required: ${r.document_title}`,to:'/approvals',label:'Review approval'})),
  ...proposals.page.items.map(r=>({key:`proposal-${r.id}`,severity:'attention',project:project(r.project_id),title:project(r.project_id)?.name || 'Project',detail:`Commercial proposal awaiting response${r.date_issued ? ` (issued ${r.date_issued})` : ''}`,to:link(r.project_id,2),label:'Review proposal'})),
  ...dates.page.items.map(r=>({key:`date-${r.id}`,severity:'upcoming',title:r.name,detail:dateFields.filter(f=>r[f] && r[f]>=day && r[f]<=`${end}T23:59:59.999Z`).map(f=>`${f==='practical_completion_date'?'Practical completion':f.slice(0,5).toUpperCase()} ${r[f].slice(0,10)}`).join(' · '),to:`/projects/${r.id}?tab=timeline`,label:'Review key dates'}))
 ];
 return {items,documentFocused,includeProjectDates,totals:{risks:risks.total,decisions:decisions.total,approvals:approvals.total,proposals:proposals.total,dates:dates.total,...documents.totals},refreshedAt:now.toISOString()};
}