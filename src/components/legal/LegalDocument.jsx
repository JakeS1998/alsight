import React from 'react';
import {Link} from 'react-router-dom';
import PortalFooter from '@/components/PortalFooter';
export default function LegalDocument({title,sections}) {
 return <div className="flex min-h-screen flex-col bg-background text-foreground">
  <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-5"><Link to="/" className="font-heading text-xl font-bold">ALSight</Link><Link to="/login" className="text-sm underline underline-offset-4">Sign in</Link></div></header>
  <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:py-14">
   <h1 className="font-heading text-3xl font-bold sm:text-4xl">{title}</h1>
   <p className="mt-3 text-sm text-muted-foreground">Draft version · Last updated 12 October 2026</p>
   <aside className="mt-6 rounded-lg border border-border bg-muted p-4 text-sm leading-relaxed">Draft for review, not legal advice. The operator’s legal identity, direct privacy contact, retention arrangements and applicable contractual requirements must be confirmed before these documents are adopted as final.</aside>
   <nav aria-label="Legal documents" className="mt-6 flex flex-wrap gap-5 text-sm"><Link to="/privacy-policy" className="underline underline-offset-4">Privacy Policy</Link><Link to="/terms-of-service" className="underline underline-offset-4">Terms and Conditions of Service</Link></nav>
   <article className="mt-9 space-y-8">{sections.map(({heading,paragraphs})=><section key={heading}><h2 className="font-heading text-lg font-semibold">{heading}</h2><div className="mt-3 space-y-3 text-sm leading-7">{paragraphs.map(text=><p key={text}>{text}</p>)}</div></section>)}</article>
  </main>
  <PortalFooter/>
 </div>;
}