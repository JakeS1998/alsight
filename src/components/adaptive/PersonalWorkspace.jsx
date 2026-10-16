import React from 'react';
import { RotateCcw, Eye } from 'lucide-react';
import WorkspaceWidget, {widgetTitles} from '@/components/adaptive/WorkspaceWidget';
import { widgetOrder } from '@/components/adaptive/adaptiveEngine';
export default function PersonalWorkspace({data,actions,context,focus,prefs}) {
 const order=widgetOrder(prefs.config,context,focus);
 const rows={projects:data.projects.map(p=>({id:p.id,title:p.name,detail:p.client_name,to:`/projects/${p.id}`})),documents:actions.filter(a=>a.category==='documents'),approvals:actions.filter(a=>a.category==='approvals'),commercial:actions.filter(a=>a.category==='commercial'),activity:data.projects.map(p=>({id:p.id,title:p.name,detail:`Updated ${new Date(p.updated_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}`,to:`/projects/${p.id}`})),opportunities:data.opportunities.map(o=>({id:o.id,title:o.title,detail:o.stage?.replaceAll('_',' '),to:`/opportunities/${o.id}`}))};
 const hrefs={projects:'/projects',documents:'/documents',approvals:'/approvals',commercial:'/finance',opportunities:'/crm/opportunities',activity:'/projects'};
 return <section className="at-workspace"><header className="at-section-head"><div><span className="at-eyebrow">A PLACE TO MAKE PROGRESS</span><h2>My workspace</h2></div><button className="at-btn" onClick={prefs.restore}><RotateCcw size={14}/> Restore default layout</button></header><p className="at-section-note">Pin what matters. Hide the rest. Use the arrows to reorder. Preferences are private to your account on this browser, with no behavioural tracking.</p>
  {!!prefs.config.hidden.length&&<div className="at-hidden-widgets">{prefs.config.hidden.filter(id=>context.widgets.includes(id)).map(id=><button className="at-btn" key={id} onClick={()=>prefs.toggle('hidden',id)}><Eye size={13}/> Show {widgetTitles[id]}</button>)}</div>}
  {prefs.error&&<p role="alert" className="at-error">{prefs.error}</p>}
  <div className="at-widget-grid">{order.map((id,index)=><WorkspaceWidget key={id} id={id} rows={rows[id]||[]} href={hrefs[id]} prefs={prefs} index={index} order={order} note={id==='projects'?`${data.projectTotal??'Unknown total'} accessible active projects · most recently updated first`:id==='activity'?'Source-record updates, not a personal browsing history.':id==='commercial'?'Proposal follow-ups in the loaded project context; not the financial ledger.':null}/>)}</div>
  {!order.length&&<div className="at-empty"><p>Your widgets are hidden. Restore the default layout to bring them back.</p></div>}
 </section>;
}