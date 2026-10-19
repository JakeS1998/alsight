import React from 'react';
import {matchPositions} from '@/components/search/orderedSearch';
export default function SearchHighlight({text,term}) {
 const value=String(text ?? ''), chars=Array.from(value), positions=new Set(matchPositions(value,term));
 if(!positions.size)return value;
 const parts=[];let start=0;
 for(let end=1;end<=chars.length;end++)if(end===chars.length || positions.has(end)!==positions.has(start)) {
  const content=chars.slice(start,end).join('');
  parts.push(positions.has(start) ? <mark key={start} className="rounded-sm bg-primary/25 text-inherit font-semibold">{content}</mark> : content);
  start=end;
 }
 return <>{parts}</>;
}