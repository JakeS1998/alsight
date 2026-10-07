import React from 'react';
export default function LookoutSection({number,title,children,action=false}) {
  return <section className={`lookout-section ${action ? 'lookout-actions' : ''}`}><h2 className="lookout-heading"><span className="lookout-number">{number}</span>{title}</h2><div className="mt-4 text-sm leading-relaxed">{children}</div></section>;
}