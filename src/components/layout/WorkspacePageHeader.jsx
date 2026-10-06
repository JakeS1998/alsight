import React from 'react';
import { Image } from '@/components/ui/image';

export default function WorkspacePageHeader({ title, description, eyebrow, image, imageAlt, actions }) {
  const fade = 'linear-gradient(90deg, transparent 0%, rgb(0 0 0 / .4) 18%, rgb(0 0 0) 42%)';
  return <>
    <header className="relative isolate flex min-h-[240px] items-center overflow-hidden rounded-hero bg-als-navy text-sidebar-foreground">
      <div className="absolute inset-y-0 right-0 -z-20 w-[70%]" style={{ maskImage: fade, WebkitMaskImage: fade }}>
        <Image src={image} alt={imageAlt} className="h-full w-full object-cover" loading="eager" />
      </div>
      <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(90deg, hsl(var(--als-navy)) 20%, hsl(var(--als-navy) / .9) 42%, hsl(var(--als-navy) / .35) 72%, hsl(var(--als-navy) / .15) 100%)' }} />
      <div className="flex w-full flex-col gap-6 px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:py-10">
        <div className="min-w-0">
        <span className="inline-block rounded-lg border border-sidebar-foreground/25 bg-als-navy/50 px-3 py-1.5 text-xs text-sidebar-foreground">{eyebrow}</span>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-lg text-sm text-sidebar-foreground/85">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end [&_.border-input]:bg-card [&_.border-input]:text-card-foreground">{actions}</div>}
      </div>
    </header>
  </>;
}