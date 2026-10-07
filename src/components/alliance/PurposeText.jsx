import React from 'react';
import ReactMarkdown from 'react-markdown';
import PurposeSources from '@/components/alliance/PurposeSources';
export default function PurposeText({text}) {
  const sourceHeading=/(?:^|\n)\s*Sources:\s*\n/i.exec(text || '');
  const body=sourceHeading ? text.slice(0,sourceHeading.index).trimEnd() : text;
  const sources=sourceHeading ? text.slice(sourceHeading.index+sourceHeading[0].length).trim() : '';
  return <div className="break-words text-sm leading-relaxed"><div className="whitespace-pre-line [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"><ReactMarkdown components={{a:({node,...props})=><a {...props} target="_blank" rel="noopener noreferrer" className="break-words text-chart-2 underline underline-offset-2"/>}}>{body}</ReactMarkdown></div>{sources && <PurposeSources text={sources}/>}</div>;
}