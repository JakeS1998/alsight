import React from 'react';
import { Image } from '@/components/ui/image';

export default function FrameworkWorkspaceHeader() {
  const fade = 'linear-gradient(90deg, transparent 0%, rgb(0 0 0 / .4) 18%, rgb(0 0 0) 42%)';
  return <header className="relative isolate flex min-h-[240px] items-center overflow-hidden rounded-hero bg-als-navy text-sidebar-foreground">
    <div className="absolute inset-y-0 right-0 -z-20 w-[70%]" style={{ maskImage: fade, WebkitMaskImage: fade }}>
      <Image src="https://media.base44.com/images/public/6ab62433a194f918c54c8249/2e8f91840_AllianceChalfont98.jpg" alt="Indoor cycling studio with colourful lighting at Chalfont leisure centre" className="h-full w-full object-cover" loading="eager" />
    </div>
    <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(90deg, hsl(var(--als-navy)) 20%, hsl(var(--als-navy) / .9) 42%, hsl(var(--als-navy) / .35) 72%, hsl(var(--als-navy) / .15) 100%)' }} />
    <div className="w-full px-6 py-8 sm:px-10 sm:py-10">
      <span className="inline-block rounded-lg border border-sidebar-foreground/25 bg-als-navy/50 px-3 py-1.5 text-xs text-sidebar-foreground">Framework 360</span>
      <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Framework</h1>
      <p className="mt-3 max-w-lg text-sm text-sidebar-foreground/85">UK Leisure Framework · Project milestones and delivery outcomes</p>
    </div>
  </header>;
}