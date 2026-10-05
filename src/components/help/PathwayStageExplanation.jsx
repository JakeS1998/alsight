import React from 'react';
export default function PathwayStageExplanation({ article, index }) {
  return <section id="pathway-stage-explanation" role="tabpanel" aria-labelledby={`pathway-stage-${index}`} tabIndex={0} className="rounded-lg border border-border bg-muted p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6">
    <div aria-live="polite" aria-atomic="true">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Stage {String(index + 1).padStart(2, '0')} of 10</p>
      <h3 className="font-heading text-xl font-bold text-foreground">{article.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{article.intro}</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">{article.steps.map(step => <li key={step}>{step}</li>)}</ol>
      {article.note && <p className="mt-5 rounded-md border-l-2 border-primary bg-card p-4 text-sm leading-relaxed text-muted-foreground">{article.note}</p>}
    </div>
  </section>;
}