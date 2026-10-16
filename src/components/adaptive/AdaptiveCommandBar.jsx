import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
export default function AdaptiveCommandBar({intelligence,hasRecords}) {
 const [question,setQuestion]=useState('');
 function submit(e){e.preventDefault();if(!question.trim()||!hasRecords||intelligence.busy)return;intelligence.request('ask',question.trim());document.getElementById('adaptive-intelligence')?.scrollIntoView({behavior:'auto',block:'start'});}
 return <form className="at-command" onSubmit={submit}><Sparkles size={23} aria-hidden="true"/><label htmlFor="adaptive-command">Ask ALICE…</label><input id="adaptive-command" maxLength={600} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about projects, documents or your working day…" aria-label="Ask ALICE about the records loaded in this workspace"/><button type="submit" disabled={!question.trim()||!hasRecords||intelligence.busy} aria-label="Ask ALICE">{intelligence.busy?<span className="at-spinner"/>:<ArrowRight size={20}/>}</button></form>;
}