import React from 'react';
import {ExternalLink} from 'lucide-react';
import {Button} from '@/components/ui/button';
const powerAppUrl='https://alslive.crm11.dynamics.com/main.aspx?appid=e986c390-c4b0-f011-bbd3-6045bd0e7eeb';
export default function BSSHub(){
 return <section className="flex min-h-[calc(100dvh-10rem)] w-full flex-col gap-3 p-3 sm:p-4">
  <header className="flex flex-wrap items-center justify-between gap-2"><h1 className="font-heading text-xl font-semibold">BSS Hub</h1><Button asChild variant="outline" size="sm"><a href={powerAppUrl} target="_blank" rel="noopener noreferrer">Open in new tab<ExternalLink/></a></Button></header>
  <p className="text-xs text-muted-foreground">Uses your own Microsoft work account and Power Apps permissions. If embedded sign-in is blocked, open in a new tab to sign in and use the app.</p>
  <iframe title="BSS Hub Power App" src={powerAppUrl} className="min-h-[calc(100dvh-16rem)] w-full flex-1 rounded-panel border border-border bg-card" allow="clipboard-read; clipboard-write"/>
 </section>;
}