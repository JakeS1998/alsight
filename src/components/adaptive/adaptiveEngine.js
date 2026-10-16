import assignedRoles from '@/components/data/assignedRoles';
import { localDay, deadlineDay } from '@/components/adaptive/adaptiveTime';
import adaptiveRoles from '@/components/adaptive/adaptiveRoles';
export const focuses = ['My priorities', 'My projects', 'Commercial', 'Documents', 'My activity'];
export function roleContext(user) {
 const roles=assignedRoles(user),role=roles.includes('director')||roles.includes('admin')?'director':roles.includes('finance')?'finance':roles.includes('bsm')?'bsm':roles.includes('bdm')?'bdm':user?.role;
 return {role,roles,...adaptiveRoles(roles)};
}
export function actionCategory(item) {
 if(item.key.startsWith('document-'))return 'documents';
 if(item.key.startsWith('proposal-'))return 'commercial';
 if(item.key.startsWith('approval-'))return 'approvals';
 if(item.key.startsWith('insurance-'))return 'compliance';
 return 'projects';
}
export function rankActions(items,context,focus,day=localDay()) {
 const preferred=context.categories||['projects'];
 const wanted={'My projects':'projects',Commercial:'commercial',Documents:'documents'}[focus];
 return items.map(item=>{const category=item.category||actionCategory(item),date=deadlineDay(item.due),level=date&&date<=day?'Urgent':item.severity==='urgent'?'Urgent':item.severity==='upcoming'?'Upcoming':'Important';return {...item,category,level,score:({Urgent:100,Important:60,Upcoming:20}[level])+(preferred.includes(category)?12:0)+(wanted===category?20:0)+(item.taskEntity?5:0)};}).sort((a,b)=>b.score-a.score||String(a.due||'9999').localeCompare(String(b.due||'9999')));
}
export function widgetOrder(config,context,focus) {
 const order=[...new Set([...(config.order||[]),...context.widgets])].filter(id=>context.widgets.includes(id)&&!(config.hidden||[]).includes(id));
 const preferred=config.order?.length?null:{'My projects':'projects',Commercial:'commercial',Documents:'documents','My activity':'activity'}[focus];
 return order.sort((a,b)=>Number((config.pinned||[]).includes(b))-Number((config.pinned||[]).includes(a))+((config.pinned||[]).includes(a)===(config.pinned||[]).includes(b)?Number(b===preferred)-Number(a===preferred):0));
}
export function evidenceContext(actions,projects) {
 return [...actions.slice(0,14).map(r=>({title:r.title,detail:r.detail||r.source||'',due:r.due||'',level:r.level,to:r.to})),...projects.slice(0,6).map(p=>({title:p.name,detail:`Active project${p.client_name?` for ${p.client_name}`:''}`,due:'',level:'Context',to:`/projects/${p.id}`}))];
}