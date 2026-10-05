import React from 'react';
const colours=['text-risk-critical','text-risk-high','text-risk-moderate','text-ase-light-green','text-success'];
const point = degrees => [90+70*Math.cos(degrees*Math.PI/180),82+70*Math.sin(degrees*Math.PI/180)];
export default function ASEGauge({rating,precise}) {
  return <svg viewBox="0 0 180 100" className="w-full max-w-52" aria-hidden="true">
    {colours.map((colour,i)=>{const a=point(182+i*36),b=point(214+i*36);return <path key={colour} d={`M ${a[0]} ${a[1]} A 70 70 0 0 1 ${b[0]} ${b[1]}`} stroke="currentColor" strokeWidth="15" fill="none" strokeLinecap="round" className={`${colour} ${rating ? '' : 'opacity-35'}`} />;})}
    {rating && <g transform={`rotate(${(Math.min(5,Math.max(1,precise || rating))-3)*36} 90 82)`}><path d="M90 82 L90 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-foreground"/><circle cx="90" cy="82" r="6" fill="currentColor" className="text-foreground"/></g>}
    {[1,2,3,4,5].map((n,i)=>{const p=point(198+i*36);return <text key={n} x={90+(p[0]-90)*0.7} y={85+(p[1]-82)*0.7} textAnchor="middle" className="fill-current text-muted-foreground" fontSize="10">{n}</text>;})}
  </svg>;
}