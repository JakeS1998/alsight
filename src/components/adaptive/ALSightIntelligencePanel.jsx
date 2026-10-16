import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Sparkles } from 'lucide-react';
export default function ALSightIntelligencePanel({intelligence,hasRecords,time}) {
 const [question,setQuestion]=useState('');
 function submit(e){e.preventDefault();if(question.trim())intelligence.request('ask',question.trim());}
 return <section className="at-panel at-intelligence scroll-mt-24" id="adaptive-intelligence"><header className="at-section-head"><div><span className="at-eyebrow"><Sparkles size={13}/> YOUR THINKING PARTNER</span><h2>ALICE Intelligence</h2></div><span className="at-ai-label">AI</span></header>
  <p className="at-section-note">A second perspective on the records loaded here. Read-only: nothing is approved or changed.</p>
  <div className="at-prompts">{(time.resting||time.checklistAvailable?['Help me organise unfinished work for my next working day.','Which loaded items might genuinely be urgent? Explain uncertainty.','Help me prioritise without adding more work.']:['What should I concentrate on today?','Help me choose a realistic next step and leave room for a break.','Summarise my assigned projects.']).map(prompt=><button key={prompt} disabled={intelligence.busy} onClick={()=>setQuestion(prompt)}>{prompt}</button>)}</div>
  {intelligence.reply&&<div className="at-conversation" aria-live="polite"><p className="at-question">{intelligence.reply.question}</p><p>{intelligence.reply.answer}</p>{intelligence.reply.suggestions.map((s,i)=><Link className="at-assistant-source" key={i} to={s.to}>{s.source} <span>{s.reason}</span></Link>)}</div>}
  <form className="at-ask" onSubmit={submit}><label className="sr-only" htmlFor="adaptive-question">Ask ALSight Intelligence</label><textarea id="adaptive-question" maxLength={600} rows={2} placeholder={hasRecords?'Ask about your working day…':'Ask when accessible records are loaded…'} value={question} onChange={e=>setQuestion(e.target.value)}/><button type="submit" className="at-icon-button" disabled={intelligence.busy||!question.trim()||!hasRecords} aria-label="Send question">{intelligence.busy?<span className="at-spinner"/>:<ArrowUp size={19}/>}</button></form>
  {intelligence.error&&<p className="at-error" role="alert">{intelligence.error}</p>}<p className="at-small">AI can make mistakes. Check the linked source. Requests use integration credits; no background AI calls.</p>
 </section>;
}