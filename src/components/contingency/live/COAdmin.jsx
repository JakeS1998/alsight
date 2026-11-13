import React,{useState} from 'react';
import COOverview from '@/components/contingency/live/COOverview';
import COSources from '@/components/contingency/live/COSources';
import COFileExceptions from '@/components/contingency/live/COFileExceptions';
import COAuditPanel from '@/components/contingency/live/COAuditPanel';
import ContingencyFeasibility from '@/components/contingency/ContingencyFeasibility';
export default function COAdmin(props){
 const [section,setSection]=useState('Status & system test');
 if(!['contingency_administrator','approving_administrator','technical_administrator'].includes(props.data.membership.duty))return null;
 const sections=['Status & system test','Sources & access','File exceptions','Audit','Feasibility'];
 return <div className="space-y-4"><section className="cc-panel"><h2>Contingency administration</h2><nav className="cc-nav mt-4 flex-wrap" aria-label="Contingency administration sections">{sections.map(label=><button key={label} type="button" aria-current={section===label?'page':undefined} className={section===label?'rounded-panel bg-contingency px-3 py-2 font-bold text-foreground':'rounded-panel px-3 py-2 text-muted-foreground hover:bg-contingency-pale'} onClick={()=>setSection(label)}>{label}</button>)}</nav></section>
 {section==='Status & system test'&&<COOverview {...props}/>}
 {section==='Sources & access'&&<COSources {...props}/>}
 {section==='File exceptions'&&<COFileExceptions/>}
 {section==='Audit'&&<COAuditPanel {...props}/>}
 {section==='Feasibility'&&<ContingencyFeasibility/>}
 </div>;
}