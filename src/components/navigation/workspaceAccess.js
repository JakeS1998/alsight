import {INTERNAL_ROLES, STAFF_WORKSPACE_ROLES} from '@/lib/portal';
import {IE_ROLES} from '@/components/ie/ieClient';
const portalRoles=[...INTERNAL_ROLES,'client','supplier','project_manager'];
export const WORKSPACE_ACCESS={
 today:[...STAFF_WORKSPACE_ROLES,'client','supplier'],
 alliance360:STAFF_WORKSPACE_ROLES,
 network:[...STAFF_WORKSPACE_ROLES,'client','project_manager'],
 people:STAFF_WORKSPACE_ROLES,
 ie:IE_ROLES,
 opportunities:INTERNAL_ROLES,
 projects:[...portalRoles,'sam_director'],
 commercial:STAFF_WORKSPACE_ROLES,
 approvals:[...portalRoles,'sam','sam_director','framework_stakeholder'],
 framework:[...INTERNAL_ROLES,'framework_stakeholder'],
 insider:STAFF_WORKSPACE_ROLES,
 account:['client'],
 contacts:['admin'],
 help:[...STAFF_WORKSPACE_ROLES,'client','supplier','project_manager','framework_stakeholder']
};
export const PORTAL_PAGES=[
 {key:'today',label:'Today',path:'/today'},
 {key:'alliance360',label:'Alliance360',path:'/alliance360'},
 {key:'network',label:'Network',path:'/suppliers'},
 {key:'ie',label:'I & E',path:'/insights-engagement'},
 {key:'opportunities',label:'Opportunities',path:'/opportunities'},
 {key:'projects',label:'Projects',path:'/projects'},
 {key:'commercial',label:'Commercial',path:'/commercial'},
 {key:'approvals',label:'Approvals',path:'/approvals'},
 {key:'framework',label:'Framework',path:'/framework'},
 {key:'insider',label:'Insider',path:'/insider'}
];
export function canViewWorkspace(identity,workspace){
 const user=typeof identity==='object'&&identity?identity:null,role=user?.role||identity;
 if(workspace==='people'&&user?.page_access?.network===false)return false;
 if(PORTAL_PAGES.some(page=>page.key===workspace)&&typeof user?.page_access?.[workspace]==='boolean')return user.page_access[workspace];
 return WORKSPACE_ACCESS[workspace]?.includes(role)||false;
}
export function canViewPage(user,key,approvalEnabled=false){
 if(key==='approvals'&&typeof user?.page_access?.approvals!=='boolean')return canViewWorkspace(user,key)&&approvalEnabled;
 return canViewWorkspace(user,key);
}
export function workspaceForPath(path,user){
 const root=path.split('/')[1];
 if(root==='projects'&&user?.role==='framework_stakeholder'&&path.split('/')[2])return 'framework';
 return ({today:'today','today-legacy':'today',alliance360:'alliance360',accounts:'network',suppliers:'network',clients:'network',people:'network',contacts:'network','insights-engagement':'ie',opportunities:'opportunities',crm:'opportunities',projects:'projects',documents:'projects',warranties:'projects',commercial:'commercial',approvals:'approvals',framework:'framework',insider:'insider',lookout:'insider'})[root];
}
export function portalHomePath(user){
 const preferred=['sam','sam_director'].includes(user?.role)?'ie':user?.role==='framework_stakeholder'?'framework':'today';
 const page=PORTAL_PAGES.find(item=>item.key===preferred&&canViewWorkspace(user,item.key))||PORTAL_PAGES.find(item=>item.key!=='approvals'&&canViewWorkspace(user,item.key));
 return page?.path||'/account-settings';
}