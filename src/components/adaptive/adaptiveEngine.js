import assignedRoles from '@/components/data/assignedRoles';
import { plannerDay } from '@/components/dashboard/plannerDates';
export const focuses = ['My priorities', 'My projects', 'Commercial', 'Documents', 'My activity'];
export function roleContext(user) {
 const roles=assignedRoles(user),role=roles.includes('director')||roles.includes('admin')?'director':roles.includes('finance')?'finance':roles.includes('bsm')?'bsm':roles.includes('bdm')?'bdm':user?.role;
 const profiles={regional_director:['Regional leadership perspective','Regional exceptions, approvals and decisions',['projects','approvals','commercial','activity','documents']],director:['Portfolio perspective','Exceptions, approvals and decisions',['projects','approvals','commercial','activity','documents']],finance:['Commercial perspective','Fees, proposals and financial follow-through',['commercial','approvals','projects','activity','documents']],bsm:['Business support perspective','Documents, compliance and project readiness',['documents','approvals','projects','activity','commercial']],bdm:['Business development perspective','Clients, opportunities and upcoming decisions',['opportunities','projects','commercial','activity','documents']]};
 const [label,description,widgets]=profiles[role]||['Your working perspective','Your assigned work and accessible records',['projects','activity','documents','approvals']];
 return {role,roles,label,description,widgets};
}
export function actionCategory(item) {
 if(item.key.startsWith('document-'))return 'documents';
 if(item.key.startsWith('proposal-'))return 'commercial';
 if(item.key.startsWith('approval-'))return 'approvals';
 if(item.key.startsWith('insurance-'))return 'compliance';
 return 'projects';
}
export function rankActions(items,role,focus) {
 const day=plannerDay(),preferred={bsm:['documents','compliance'],bdm:['commercial','projects'],finance:['commercial','approvals'],director:['approvals','projects']}[role]||['projects'];
 const wanted={'My projects':'projects',Commercial:'commercial',Documents:'documents'}[focus];
 return items.map(item=>{const category=item.category||actionCategory(item),date=item.due?.slice(0,10),level=date&&date<=day?'Urgent':item.severity==='urgent'?'Urgent':item.severity==='upcoming'?'Upcoming':'Important';return {...item,category,level,score:({Urgent:100,Important:60,Upcoming:20}[level])+(preferred.includes(category)?12:0)+(wanted===category?20:0)+(item.taskEntity?5:0)};}).sort((a,b)=>b.score-a.score||String(a.due||'9999').localeCompare(String(b.due||'9999')));
}
export function widgetOrder(config,context,focus) {
 const order=[...new Set([...(config.order||[]),...context.widgets])].filter(id=>context.widgets.includes(id)&&!(config.hidden||[]).includes(id));
 const preferred={'My projects':'projects',Commercial:'commercial',Documents:'documents','My activity':'activity'}[focus];
 return order.sort((a,b)=>Number((config.pinned||[]).includes(b))-Number((config.pinned||[]).includes(a))+((config.pinned||[]).includes(a)===(config.pinned||[]).includes(b)?Number(b===preferred)-Number(a===preferred):0));
}
export function evidenceContext(actions,projects) {
 return [...actions.slice(0,14).map(r=>({title:r.title,detail:r.detail||r.source||'',due:r.due||'',level:r.level,to:r.to})),...projects.slice(0,6).map(p=>({title:p.name,detail:`Active project${p.client_name?` for ${p.client_name}`:''}`,due:'',level:'Context',to:`/projects/${p.id}`}))];
}