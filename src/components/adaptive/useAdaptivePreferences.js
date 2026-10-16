import { useState } from 'react';
const empty={order:[],hidden:[],pinned:[],dismissed:[],focus:'My priorities',lastVisit:null,workday:{start:'09:00',end:'17:00'},completions:null};
export default function useAdaptivePreferences(userId) {
 const key=`alsight-adaptive-v1:${userId}`;
 const [error,setError]=useState('');
 const [config,setConfig]=useState(()=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'?{...empty,...value}:empty;}catch{return empty;}});
 const [since]=useState(config.lastVisit);
 const save=changes=>setConfig(old=>{const next={...old,...(typeof changes==='function'?changes(old):changes)};try{localStorage.setItem(key,JSON.stringify(next));setError('');}catch{setError('Preferences could not be saved on this device.');}return next;});
 const toggle=(field,id)=>save(old=>({[field]:old[field].includes(id)?old[field].filter(x=>x!==id):[...old[field],id]}));
 const move=(id,delta,visible)=>{const order=[...visible],at=order.indexOf(id),target=at+delta;if(target<0||target>=order.length)return;[order[at],order[target]]=[order[target],order[at]];save({order});};
 return {config,since,error,save,toggle,move,restore:()=>save({order:[],hidden:[],pinned:[],focus:'My priorities'}),dismiss:id=>toggle('dismissed',id)};
}