import React from 'react';
const colours=['text-risk-critical','text-risk-high','text-risk-moderate','text-ase-light-green','text-success'];
const bands=['Very weak','Weak','Moderate','Good','Strong'];
const point=(degrees,radius=87)=>[120+radius*Math.cos(degrees*Math.PI/180),116+radius*Math.sin(degrees*Math.PI/180)];
const arc=(start,end)=>{const a=point(start),b=point(end);return `M ${a[0]} ${a[1]} A 87 87 0 ${end-start>180 ? 1 : 0} 1 ${b[0]} ${b[1]}`;};
export default function ASEGauge({rating,precise,label,loading=false,showScale=false,decimal=false}) {
 const available=!loading && Number.isFinite(rating) && rating>=1 && rating<=5;
 const score=available ? Math.min(5,Math.max(1,Number.isFinite(precise) ? precise : rating)) : null;
 const marker=score!=null ? point(150+(score-1)*60) : null;
 const colour=available ? colours[Math.min(4,Math.max(0,Math.round(score)-1))] : 'text-border';
 return <svg viewBox="0 0 240 213" className={`w-full ${loading ? 'animate-pulse' : ''}`} role="img" aria-label={loading ? 'ASE rating calculating' : available ? `ASE rating ${rating} out of 5, ${label || bands[rating-1]}` : 'ASE rating not available'}>
  <path d={arc(150,390)} stroke="currentColor" strokeWidth="17" fill="none" strokeLinecap="round" className="text-border"/>
  {available && colours.map((tone,i)=><path key={tone} d={arc(152+i*48,150+(i+1)*48-2)} stroke="currentColor" strokeWidth="17" fill="none" className={tone}/>)}
  {available && [152,388].map((angle,i)=>{const p=point(angle);return <circle key={angle} cx={p[0]} cy={p[1]} r="8.5" fill="currentColor" className={i===0 ? colours[0] : colours[4]}/>;})}
  {showScale && available && [1,2,3,4,5].map((n,i)=>{const p=point(150+i*60,111);return <text key={n} x={p[0]} y={p[1]+4} textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor" className="text-foreground">{n}</text>;})}
  {marker && <circle cx={marker[0]} cy={marker[1]} r="10" fill="currentColor" stroke="hsl(var(--card))" strokeWidth="3" className={colour}/>}
  <text x="120" y="133" textAnchor="middle" fill="currentColor" className="text-foreground" fontSize={available ? decimal ? '40' : '49' : '32'} fontWeight="800">{available ? <>{decimal ? score.toFixed(1) : rating}<tspan fontSize="28">/5</tspan></> : loading ? '--' : 'N/A'}</text>
  <text x="120" y="159" textAnchor="middle" fill="currentColor" className="text-foreground" fontSize="15" fontWeight="700">{loading ? 'Calculating…' : available ? (label || bands[rating-1]).replace(/^Provisional(?:\s*[·:–-]\s*|\s+)/i,'') : 'Not available'}</text>
 </svg>;
}