import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
export default function AccountInsightCard({ account }) {
  const [text,setText]=useState('');
  const launch = question => {
    window.dispatchEvent(new CustomEvent('alsight-open-alice', { detail: { prompt: `${question || 'Summarise this account'} for account ${account.name} (account ID ${account.id}). Use only records I can access: current projects and opportunities, relationship activity and recorded All Seeing Eye evidence. Do not invent financial or ownership data.`, autoSend: true } }));
    setText('');
  };
  const prompts=['Summarise this account','Current projects','All Seeing Eye evidence'];
  return <section className="account-panel account-insight-card text-sidebar-foreground">
    <header className="mb-3 flex items-center gap-3"><Sparkles className="h-7 w-7 shrink-0 text-primary"/><div><h2 className="text-base font-extrabold">Ask ALICE</h2><p className="text-[10px] opacity-80">Your Alliance Leisure Intelligence &amp; Construction Expert</p></div></header>
    <form onSubmit={event=>{event.preventDefault();launch(text.trim());}} className="flex items-center gap-2 rounded-full bg-background p-1 text-foreground"><input aria-label={`Ask ALICE about ${account.name}`} value={text} onChange={event=>setText(event.target.value)} placeholder="What do you need to know?" className="min-w-0 flex-1 rounded-full bg-transparent px-3 py-2 text-xs outline-none"/><button type="submit" aria-label="Send your account question to ALICE" className="rounded-full bg-chart-4/30 p-2"><ArrowRight className="h-4 w-4"/></button></form>
    <div className="mt-3 flex flex-wrap gap-2">{prompts.map(prompt=><button key={prompt} type="button" onClick={()=>launch(prompt)} className="rounded-full border border-sidebar-foreground/30 px-3 py-1 text-[10px] hover:bg-sidebar-foreground/10">{prompt}</button>)}</div>
  </section>;
}