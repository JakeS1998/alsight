import React, { useState } from 'react';
import { ListChecks, RotateCcw } from 'lucide-react';
import PriorityCard from '@/components/adaptive/PriorityCard';
export default function PriorityActions({actions,prefs,onComplete,moreTasks}) {
 const [limit,setLimit]=useState(5);
 return <section id="adaptive-priorities" className="at-panel at-priorities"><header className="at-section-head"><div><span className="at-eyebrow">YOUR NEXT BEST STEP</span><h2>Priority actions <ListChecks size={19}/></h2></div>{prefs.config.dismissed.length>0&&<button className="at-icon-button" title="Restore dismissed signals" aria-label="Restore dismissed signals" onClick={()=>prefs.save({dismissed:[]})}><RotateCcw size={17}/></button>}</header><p className="at-section-note">A curated view of assigned work and accessible project signals, not a complete task register.</p>
  {actions.length?actions.slice(0,limit).map((item,index)=><PriorityCard key={item.key} item={item} index={index} onDismiss={prefs.dismiss} onComplete={onComplete}/>):<div className="at-empty"><ListChecks size={27}/><h3>A clearer space to work.</h3><p>No visible attention signals. Hidden items can be restored above; unavailable sources are noted separately.</p></div>}
  {actions.length>limit&&<button className="at-btn at-load-more" onClick={()=>setLimit(limit+5)}>Show more loaded signals</button>}
  {moreTasks&&<p className="at-small at-panel-foot">Showing the earliest 10 tasks per source. Open a task’s project or opportunity for its full register.</p>}
 </section>;
}