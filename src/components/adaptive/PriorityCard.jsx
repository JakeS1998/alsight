import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, ChevronDown, X } from 'lucide-react';
import PrioritySignalIcon from '@/components/adaptive/PrioritySignalIcon';
export default function PriorityCard({item,onDismiss,onComplete,onAsk,index}) {
 const [expanded,setExpanded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[confirm,setConfirm]=useState(false);
 async function complete(){setBusy(true);setError('');try{await onComplete(item);}catch(e){setError(e.response?.data?.error||e.message);}finally{setBusy(false);setConfirm(false);}}
 return <article className="at-priority" data-intent={item.intent} data-level={item.level} data-wellbeing-suppress={confirm||busy?'true':undefined}>
  <div className="at-priority-index"><PrioritySignalIcon item={item}/><span className="sr-only">Priority {index+1}</span></div><div className="at-priority-body"><div className="at-item-top"><span className="at-badge" data-intent={item.intent}>{item.attentionKind||item.intent||item.level}</span><span className="at-small">{item.dateLabel||item.category}</span>{item.due&&<time dateTime={item.due}>{new Date(item.due).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</time>}</div>
   <h3><Link to={item.to}>{item.title}</Link></h3><p>{item.detail||item.source||'A source record requires your attention.'}</p>
   <div className="at-item-actions"><Link className="at-text-link" to={item.to}>{item.label||'Review source'} <ArrowUpRight size={14}/></Link><button className="at-text-link at-subtle" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>Why this? <ChevronDown size={13}/></button>{onAsk&&<button className="at-text-link at-subtle" onClick={()=>onAsk(item)}>Ask ALICE</button>}{item.taskEntity&&<button className="at-text-link" disabled={busy} onClick={()=>setConfirm(!confirm)}><Check size={14}/> {item.taskEntity === 'ProjectAction' ? 'Mark complete' : 'Complete'}</button>}</div>
   {expanded&&<div className="at-explanation"><strong>Source: {item.source}.</strong> {item.why} {item.dateLabel&&`${item.dateLabel} is a date condition, not an instruction to act immediately. `}{item.timeReason} Your recorded responsibility, saved focus and time context influence presentation. Dismissing hides this signal only; it does not change the source record.</div>}
   {confirm&&<div className="at-confirm"><span>Mark this assigned task complete?</span><button className="at-btn at-btn-primary" disabled={busy} onClick={complete}>{busy?'Saving…':'Confirm completion'}</button><button className="at-btn" disabled={busy} onClick={()=>setConfirm(false)}>Cancel</button></div>}
   {error&&<p role="alert" className="at-error">{error}</p>}
  </div><button className="at-icon-button" aria-label={`Dismiss ${item.title}`} title="Hide this signal, not the source record" onClick={()=>onDismiss(item.key)}><X size={15}/></button>
 </article>;
}