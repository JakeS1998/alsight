import React from 'react';
import ReactMarkdown from 'react-markdown';
export default function PurposeText({text}) {
  return <div className="whitespace-pre-line break-words text-sm leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"><ReactMarkdown components={{a:({node,...props})=><a {...props} target="_blank" rel="noopener noreferrer" className="break-words text-chart-2 underline underline-offset-2"/>}}>{text}</ReactMarkdown></div>;
}