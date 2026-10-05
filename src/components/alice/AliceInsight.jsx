import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function AliceInsight({ title = 'ALICE Insight', statements = [], evidence = [], signals = [], detail, children, onAcknowledge }) {
  const [expanded, setExpanded] = useState(false);
  const [sources, setSources] = useState(false);
  return <section aria-label={title} className="rounded-xl border border-border border-l-2 border-l-primary bg-card p-4 text-foreground">
    <header className="mb-2 flex items-center gap-2"><Sparkles aria-hidden="true" className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold text-als-navy">{title}</h2>{onAcknowledge && <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={onAcknowledge}>Acknowledge</Button>}</header>
    <ul className="space-y-1 text-sm">{statements.map((s, i) => <li key={i}>{s.to ? <Link className="hover:underline underline-offset-4" to={s.to}>{s.text}</Link> : s.text}</li>)}</ul>
    {children}
    {signals.length > 0 && <div className="mt-3 border-t border-border pt-2"><h3 className="text-xs font-semibold text-als-navy">ALICE Signals</h3><ul className="mt-1 space-y-1 text-xs text-muted-foreground">{signals.map((s, i) => <li key={i}>{s.to ? <Link to={s.to} className="hover:underline">{s.text}</Link> : s.text}</li>)}</ul></div>}
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {detail && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="hover:text-foreground">{expanded ? 'Hide full insight' : 'View full insight'}</button>}
      {evidence.length > 0 && <button type="button" aria-expanded={sources} onClick={() => setSources(!sources)} className="hover:text-foreground">{sources ? 'Hide evidence' : 'View evidence'}</button>}
    </div>
    {expanded && <p className="mt-2 text-sm text-muted-foreground">{detail}</p>}
    {sources && <div className="mt-3 rounded-lg bg-muted p-3"><h3 className="text-xs font-semibold">Evidence</h3><ul className="mt-1 space-y-1 text-xs">{evidence.map((s, i) => <li key={i}>{s.to ? <Link to={s.to} className="hover:underline">{s.text}</Link> : s.text}</li>)}</ul></div>}
    <p className="mt-3 text-[10px] text-muted-foreground">ALICE explains ALSight information and points to in-platform workflows. Humans decide and undertake real-world activities.</p>
  </section>;
}