import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import adaptiveLayoutCommand from '@/components/adaptive/adaptiveLayoutCommand';
export default function AdaptiveCommandBar({intelligence,hasRecords,prefs,context,onFeedback}) {
 const [question,setQuestion]=useState(''),setFeedback=onFeedback;
 function submit(e){
  e.preventDefault();if(!question.trim()||intelligence.busy)return;
  const command=adaptiveLayoutCommand(question.trim(),prefs.config,context);
  if(command){if(command.patch)prefs.save(command.patch);setFeedback(command.error||command.message);if(!command.error)setQuestion('');return;}
  if(!hasRecords){setFeedback('No source records are loaded yet. Layout commands remain available.');return;}
  setFeedback('');intelligence.request('ask',question.trim());document.getElementById('adaptive-intelligence')?.scrollIntoView({behavior:'auto',block:'start'});
 }
 return <form className="at-command" onSubmit={submit}><Sparkles size={23} aria-hidden="true"/><label htmlFor="adaptive-command">Ask ALICE…</label><input id="adaptive-command" maxLength={600} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about my day, or pin projects…" aria-label="Ask ALICE about loaded records or change your workspace layout" aria-describedby="adaptive-command-help"/><button type="submit" disabled={!question.trim()||intelligence.busy} aria-label="Ask ALICE">{intelligence.busy?<span className="at-spinner"/>:<ArrowRight size={20}/>}</button></form>;
}