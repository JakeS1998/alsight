import React,{useContext} from 'react';
import {Link} from 'react-router-dom';
import PathwayWorkContext from '@/components/delivery/PathwayWorkContext';
export default function BmsWorkAction({task,projectId,canEdit}) {
 const work=useContext(PathwayWorkContext),base=`/projects/${projectId}`;
 const tab=task.key==='warranty_tracker'||task.key==='warranties'?'warranties':task.key==='monthly_valuations'?'valuations':['cost_summary','affordability','contract_po','final_invoicing'].includes(task.key)?'finance':null;
 if(tab)return <Link className="mt-2 inline-block font-medium underline" to={`${base}?tab=${tab}`}>Open {tab==='finance'?'Finance':tab==='valuations'?'Valuations':'live Warranties'}</Link>;
 const meetingKind={progress_meetings:'progress',handover_meeting:'handover',post_review:'post_review'}[task.key];
 if(meetingKind)return <button type="button" className="mt-2 font-medium underline" onClick={()=>work?.open({...task,meetingKind})}>Record / view meeting in Act</button>;
 if(!task.source&&work&&canEdit)return <button type="button" className="mt-2 font-medium underline" onClick={()=>work.open(task)}>{task.linked?`Open existing ${task.linked.entity==='ProjectDecision'?'decision in Decide':'action in Act'}`:task.gate?'Record decision in Decide':'Work on action in Act'}</button>;
 return null;
}