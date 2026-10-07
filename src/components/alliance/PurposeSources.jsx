import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function PurposeSources({text}) {
  return <div className="mt-3 space-y-2 whitespace-normal">
    <p className="text-xs font-semibold text-muted-foreground">Sources</p>
    <ReactMarkdown components={{
      ol:({children,start=1})=><ol className="flex list-none flex-wrap gap-2 p-0" style={{counterReset:`source ${start-1}`}}>{children}</ol>,
      ul:({children})=><ul className="flex list-none flex-wrap gap-2 p-0 [counter-reset:source]">{children}</ul>,
      li:({children})=><li className="contents before:hidden [counter-increment:source] [&_a]:before:mr-1 [&_a]:before:content-['['counter(source)']']">{children}</li>,
      p:({children})=><span className="contents">{children}</span>,
      a:({href,children})=>{
        const title=React.Children.toArray(children).join('');
        const parts=title.replace(/\s*\([^)]*\)\s*$/,'').split(/\s+[–—-]\s+|\s*\|\s*/);
        const name=parts.length>1 ? parts[parts.length-1].trim() : href ? new URL(href,'https://alsight.base44.app').hostname.replace(/^www\./,'') : title;
        return <a href={href} title={title} aria-label={title} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium leading-snug text-chart-2 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{name}</a>;
      }
    }}>{text}</ReactMarkdown>
  </div>;
}