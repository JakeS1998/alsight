import React from 'react';
import { Image } from '@/components/ui/image';
import HelpArticles from '@/components/help/HelpArticles';
import { pathwayHelpArticles } from '@/components/help/pathwayHelpContent';
const overview = 'https://media.base44.com/images/public/6ab62433a194f918c54c8249/b774bb14c_image.png';
const diagrams = [
  { url: 'https://media.base44.com/images/public/6ab62433a194f918c54c8249/dd59694dc_image.png', title: 'Pathway lifecycle, roles and information flow' },
  { url: 'https://media.base44.com/images/public/6ab62433a194f918c54c8249/58fdba9fe_image.png', title: 'Pathway stages, gateways and handover reference' },
];
export default function HelpPathway() {
  return <div className="space-y-5">
    <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-heading text-xl font-bold text-als-navy">ALSight Project Pathway</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Ten connected stages bring commercial, legal, design and delivery information together, from opportunity through to handover. The stages are a connected journey, not ten isolated tasks; actions, decisions and risks continue throughout delivery.</p>
      <figure className="mt-4"><Image src={overview} fittingType="fit" alt="Ten Project Pathway stages: Scope, Fee, Prepare, Design, Programme, Act, Decide, De-risk, Build and Handover." className="aspect-[1024/409] w-full rounded-lg" /><figcaption className="mt-2 text-xs text-muted-foreground">Project Pathway reference overview · <a href={overview} target="_blank" rel="noreferrer" className="underline underline-offset-4">Open full-size diagram</a></figcaption></figure>
    </section>
    <HelpArticles articles={pathwayHelpArticles} />
    <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-heading text-lg font-bold">Readiness, roles and RIBA</h2><div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
      <p><strong className="text-foreground">Readiness:</strong> live stage labels include Not Started, In Progress, Complete, Complete with Conditions and Insufficient Data. Open the stage breakdown to understand the recorded evidence. Missing information is not automatically a blocked gateway.</p>
      <p><strong className="text-foreground">Shared responsibility:</strong> the BDM coordinates the project journey; BSM, PM, design team, legal, finance, contractor and client contribute their respective information, reviews and decisions. Actual editing and approval permissions are determined by your portal role and project assignment.</p>
      <p><strong className="text-foreground">RIBA alignment:</strong> RIBA design and delivery stages sit alongside the ten Pathway stages, not in a one-to-one mapping. Design development spans RIBA 1–4; construction and handover span RIBA 5–7. Use the project’s recorded RIBA dates and source evidence.</p>
      <p><strong className="text-foreground">Reference diagrams:</strong> the illustrated colours, example progress and gateways below explain the approach; they are not live project data or an override of the current portal checks.</p>
    </div></section>
    <details className="rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer font-heading font-bold">View the detailed reference diagrams</summary><div className="mt-4 space-y-6">{diagrams.map(item => <figure key={item.url}><Image src={item.url} fittingType="fit" alt={item.title} className="aspect-[1024/682] w-full rounded-lg" loading="lazy" /><figcaption className="mt-2 text-sm">{item.title} · <a href={item.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">Open full-size diagram</a></figcaption></figure>)}</div></details>
  </div>;
}