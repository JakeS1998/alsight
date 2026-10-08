import React, { useState } from 'react';
import { Check, CircleHelp } from 'lucide-react';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function OnboardingFrame({ steps, step, children }) {
  const [help, setHelp] = useState(false);
  const index = steps.findIndex(item => item.id === step);
  return <main className="relative flex min-h-[100svh] flex-col bg-als-navy font-body">
    <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url(https://allianceleisure.co.uk/wp-content/uploads/2025/10/Wilsons-Cath-Thom-Open-Day-101025-31.jpg)' }} aria-hidden="true" />
    <div className="absolute inset-0 bg-gradient-to-t from-als-navy via-als-navy/40 to-als-navy/20" aria-hidden="true" />
    <header className="relative mx-auto flex w-full max-w-7xl items-center px-6 py-6 sm:px-10"><Logo variant="header" className="h-14 w-48" /></header>
    <div className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
      <section aria-label="Set up your ALSight account" className="w-full max-w-xl rounded-hero border border-border bg-card p-6 text-center text-card-foreground shadow-xl sm:p-10">
        <ol aria-label="Setup progress" className="mb-10 flex justify-between gap-1">
          {steps.map((item, number) => <li key={item.id} aria-current={number === index ? 'step' : undefined} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${number === index ? 'bg-primary text-primary-foreground' : number < index ? 'bg-success text-card' : 'bg-muted text-muted-foreground'}`}>
              {number < index ? <Check className="h-4 w-4" /> : number + 1}
            </span><span className={`text-[10px] sm:text-xs ${number === index ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{item.label}</span>
          </li>)}
        </ol>
        {children}
      </section>
    </div>
    <footer className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
      <span className="text-sm font-medium text-sidebar-foreground">Alliance Leisure</span>
      <Button variant="ghost" className="text-sidebar-foreground" onClick={() => setHelp(true)}><CircleHelp />Need help?</Button>
    </footer>
    <Dialog open={help} onOpenChange={setHelp}><DialogContent><DialogHeader><DialogTitle>Need help?</DialogTitle><DialogDescription>Contact your ALSight administrator or Alliance Leisure IT team and tell them which setup step you are on.</DialogDescription></DialogHeader>
      <p className="text-sm text-muted-foreground">Current step: {steps[index]?.label}. If Microsoft asks for administrator approval, IT needs to approve access before you can connect. You can also choose “Set up later” and connect from Account Settings.</p>
      <Button onClick={() => setHelp(false)}>Back to setup</Button>
    </DialogContent></Dialog>
  </main>;
}