import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { timeSuggestions } from '@/components/adaptive/adaptiveTime';
export default function IntelligentRecommendations({actions,intelligence,prefs,time}) {
 const suggestions=intelligence.insights?.suggestions||timeSuggestions(actions,time);
 return <section className="at-recommendations"><header className="at-section-head"><div><span className="at-eyebrow"><Sparkles size={13}/> A LITTLE FORESIGHT</span><h2>{time.phase==='wrap'?'What carries forward?':time.phase==='afternoon'?'Make the most of your afternoon':time.phase==='morning'?'Suggested start to your day':'Your next sensible step'}</h2></div><button className="at-btn at-btn-light" disabled={intelligence.busy||!actions.length} onClick={()=>intelligence.request('recommend','What should I do next, and why? Give three grounded recommendations.')}>{intelligence.busy?'Thinking…':intelligence.insights?'Refresh AI insights':'Generate AI insights'}</button></header>
  <p className="at-section-note">{intelligence.insights?'AI-generated from the accessible records on this page. Verify against the source before acting.':'Source-based suggestions below. Generate AI insights for a grounded AI interpretation; uses integration credits.'}</p>
  {intelligence.insights&&<p className="at-ai-summary">{intelligence.insights.answer}</p>}
  <div className="at-recommendation-grid">{suggestions.filter(s=>!prefs.config.dismissed.includes(`recommendation-${s.to}`)).map((s,i)=><article key={`${s.to}-${i}`}><span className="at-rec-number">0{i+1}</span><h3>{s.title}</h3><p>{s.reason}</p><span className="at-rec-source">{s.source}</span><div className="at-item-actions"><Link className="at-text-link" to={s.to}>Review now <ArrowUpRight size={14}/></Link><button className="at-text-link" onClick={()=>prefs.dismiss(`recommendation-${s.to}`)}>Dismiss</button></div></article>)}</div>
  {!suggestions.length&&<p className="at-section-note">No grounded recommendations yet. Refresh your sources or return when new work is assigned.</p>}
  {intelligence.error&&<p role="alert" className="at-error">{intelligence.error}</p>}
 </section>;
}