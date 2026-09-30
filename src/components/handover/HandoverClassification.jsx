import React from 'react';
const styles = {
  statutory: ['Statutory', 'border-destructive/30 bg-destructive/10 text-destructive'],
  statutory_applicable: ['Statutory where applicable', 'border-primary/40 bg-primary/10 text-foreground'],
  statutory_content: ['Statutory information / contractual', 'border-primary/40 bg-primary/10 text-foreground'],
  contractual: ['Contractual', 'border-als-navy-light/30 bg-als-navy-light/10 text-als-navy-light'],
  project: ['Project requirement', 'border-border bg-muted text-muted-foreground'],
};
export default function HandoverClassification({ classification }) {
  const [label, style] = styles[classification] || styles.project;
  return <span className={`ml-2 inline-block rounded-full border px-2 py-0.5 text-[10px] font-normal uppercase ${style}`}>{label}</span>;
}