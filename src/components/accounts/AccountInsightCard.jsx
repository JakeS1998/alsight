import React from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function AccountInsightCard({ account }) {
  const launch = () => window.dispatchEvent(new CustomEvent('alsight-open-alice', { detail: { prompt: `Review account ${account.name} (account ID ${account.id}). Summarise only records I can access, current projects and opportunities, relationship activity and recorded ASE evidence. Do not invent financial or ownership data.`, autoSend: true } }));
  return <section className="account-panel account-insight-card">
    <h2 className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></span>ALICE Account Insight</h2>
    <p className="text-sm text-muted-foreground">Ask ALICE to interpret this account’s accessible projects, opportunities, relationship activity and ASE evidence.</p>
    <Button variant="outline" className="mt-5 w-full justify-between whitespace-normal text-left" onClick={launch}>Ask ALICE about this account<ArrowUpRight /></Button>
  </section>;
}