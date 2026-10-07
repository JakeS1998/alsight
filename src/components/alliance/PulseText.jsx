import React from 'react';
import {Link,useSearchParams} from 'react-router-dom';

export default function PulseText({text='',mentions=[]}) {
  const [params]=useSearchParams(),group=params.get('group');
  const names=[...(text.match(/(^|\s)(@everyone)(?=$|[\s.,!?;:])/ig) || []).map(part=>part.trim()),...mentions.map(person=>`@${person.name}`)].sort((a,b)=>b.length-a.length);
  const escaped=names.map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const pattern=new RegExp(`(${[...escaped,'#[A-Za-z0-9_]+'].join('|')})`,'g');
  return <>{text.split(pattern).map((part,index)=>names.includes(part) ? <span key={index} className="rounded bg-primary/10 px-0.5 font-semibold text-chart-2">{part}</span> : /^#[A-Za-z0-9_]+$/.test(part) ? <Link key={index} to={`/pulse?${new URLSearchParams({...group ? {group} : {},hashtag:part.slice(1)})}`} className="font-semibold text-chart-2 hover:underline">{part}</Link> : <React.Fragment key={index}>{part}</React.Fragment>)}</>;
}