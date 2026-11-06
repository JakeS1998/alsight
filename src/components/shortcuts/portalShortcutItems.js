import {PORTAL_PAGES,canViewPage,canViewWorkspace} from '@/components/navigation/workspaceAccess';
import {internalMessagingRoles} from '@/components/messaging/messageClient';
const keys={today:'t',alliance360:'a',network:'r',ie:'e',opportunities:'o',projects:'p',commercial:'c',approvals:'v',framework:'f',insider:'i'};
export default function portalShortcutItems(user,approvalsEnabled){
 const items=PORTAL_PAGES.filter(p=>canViewPage(user,p.key,approvalsEnabled)).map(p=>({keys:`g ${keys[p.key]}`,label:p.label,path:p.path,group:'Navigation'}));
 if(canViewWorkspace(user,'people')&&canViewWorkspace(user,'network'))items.push({keys:'g u',label:'People',path:'/people',group:'Navigation'});
 if(canViewWorkspace(user,'network'))items.push({keys:'g l',label:'Clients',path:'/clients',group:'Navigation'});
 items.push(...[['g d','My calendar','/calendar'],['g s','Account settings','/account-settings']].map(([keys,label,path])=>({keys,label,path,group:'Navigation'})));
 if(canViewWorkspace(user,'help'))items.push({keys:'g h',label:'Help',path:'/help',group:'Navigation'});
 const create=(keys,label,path,action)=>items.push({keys,label,path:`${path}?shortcut=${action}`,group:'New records'});
 if(canViewWorkspace(user,'projects')&&['admin','director','bdm'].includes(user?.role))create('n p','Request project','/projects','project');
 if(canViewWorkspace(user,'opportunities')&&['admin','director','bdm','bsm'].includes(user?.role))create('n o','New opportunity','/opportunities','opportunity');
 if(canViewWorkspace(user,'network')&&canViewWorkspace(user,'people')&&user?.role==='admin')create('n c','New person','/people','person');
 if(internalMessagingRoles.includes(user?.role))items.push({keys:'n m',label:'New team message',event:'als-shortcut-new-message',group:'New records'});
 items.push({keys:'/',label:'Search ALS Hub',event:'als-shortcut-search',group:'Common actions'},{keys:'?',label:'Keyboard shortcuts',event:'als-open-shortcuts',group:'Common actions'},{keys:'o f',label:'Page feedback',event:'als-open-page-feedback',group:'Common actions'});
 return items;
}