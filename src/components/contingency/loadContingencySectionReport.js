import {base44} from '@/api/base44Client';
import contingencyReportData,{auditReport} from '@/components/contingency/contingencyReportData';
import {snapshot,stamp} from '@/components/contingency/demoData';
export default async function loadContingencySectionReport(path,state,actor,user){
 const report=contingencyReportData(path,state),section=path.replace(/^\/contingency\/?/,'').replace(/\/$/,'');
 if(report&&['','environment'].includes(section)&&state.status!=='ACTIVE'&&actor.role!=='Employee'&&section!=='environment'){
  const page=await base44.entities.ContingencyAuditLog.filter({sandbox_owner:user.id},{sort:'-occurred_at',limit:6});
  report.sections.push(...auditReport(page.items,'').sections.map(s=>({...s,title:'Recent recorded activity'})));
  const samples=['Scheduled synchronisation completed','Project records replicated','Documents uploaded','Administrator logged in','System health check completed'];
  report.sections.push({title:'Illustrative activity',headers:['Action','Event type','Occurred UK'],rows:samples.map((label,i)=>[label,'Illustrative event',stamp(new Date(new Date(snapshot).getTime()-i*60000))])});
 }
 return report;
}