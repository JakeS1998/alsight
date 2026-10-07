import React from 'react';
import {Link,useSearchParams} from 'react-router-dom';

export default function PulseText({text=''}) {
  const [params]=useSearchParams(),group=params.get('group');
  return <>{text.split(/(#[A-Za-z0-9_]+)/g).map((part,index)=>/^#[A-Za-z0-9_]+$/.test(part) ? <Link key={index} to={`/pulse?${new URLSearchParams({...group ? {group} : {},hashtag:part.slice(1)})}`} className="font-semibold text-chart-2 hover:underline">{part}</Link> : <React.Fragment key={index}>{part}</React.Fragment>)}</>;
}