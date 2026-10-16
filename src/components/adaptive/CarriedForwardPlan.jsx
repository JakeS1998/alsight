import React from 'react';
import { Link } from 'react-router-dom';
export default function CarriedForwardPlan({prefs}) {
 const plan=prefs.config.carryForward;
 if(!plan?.items?.length)return null;
 return <section className="at-panel at-time-briefing"><header className="at-section-head"><div><span className="at-eyebrow">YOUR PERSONAL PLAN · {plan.date}</span><h2>Items you carried forward</h2></div></header><p className="at-small">Planning notes only, not confirmation that work is complete or that deadlines have changed. Check the source for the current status.</p><ul className="mt-3 space-y-2">{plan.items.map(item=><li key={item.key} className="flex flex-wrap items-center justify-between gap-3 text-sm"><Link className="underline underline-offset-4" to={item.to}>{item.title}</Link><button type="button" className="text-xs underline underline-offset-4" onClick={()=>prefs.save(old=>({carryForward:{...old.carryForward,items:old.carryForward.items.filter(row=>row.key!==item.key)}}))}>Remove from plan</button></li>)}</ul></section>;
}