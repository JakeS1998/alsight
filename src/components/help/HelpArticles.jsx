import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
export default function HelpArticles({ articles }) {
  return <Accordion type="multiple" className="rounded-xl border border-border bg-card px-5">
    {articles.map(article => <AccordionItem key={article.title} value={article.title}>
      <AccordionTrigger className="text-left font-heading">{article.title}</AccordionTrigger>
      <AccordionContent className="space-y-3 text-sm leading-relaxed">
        {article.intro && <p className="text-muted-foreground">{article.intro}</p>}
        <ol className="list-decimal space-y-2 pl-5">{article.steps.map(step => <li key={step}>{step}</li>)}</ol>
        {article.note && <p className="rounded-lg border-l-2 border-primary bg-muted p-3 text-muted-foreground">{article.note}</p>}
      </AccordionContent>
    </AccordionItem>)}
  </Accordion>;
}