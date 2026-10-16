import { useState } from 'react';
import useSyncedPreferences from '@/components/adaptive/useSyncedPreferences';
const empty={order:[],hidden:[],pinned:[],dismissed:[],focus:'My priorities',lastVisit:null,workday:{start:'09:00',end:'17:00'},completions:null,wrapUp:null,carryForward:null};
export default function useAdaptivePreferences(userId) {
 const key=`alsight-adaptive-v1:${userId}`;
 const sync=useSyncedPreferences(userId,'adaptive',key,empty),config=sync.value,save=sync.save;
 const [cachedSince]=useState(config.lastVisit),since=sync.baseline?sync.baseline.lastVisit:cachedSince;
 const toggle=(field,id)=>save(old=>({[field]:old[field].includes(id)?old[field].filter(x=>x!==id):[...old[field],id]}));
 const move=(id,delta,visible)=>{const order=[...visible],at=order.indexOf(id),target=at+delta;if(target<0||target>=order.length)return;[order[at],order[target]]=[order[target],order[at]];save({order});};
 return {config,since,error:sync.error,ready:sync.ready,saving:sync.saving,retry:sync.retry,save,toggle,move,restore:()=>save({order:[],hidden:[],pinned:[],focus:'My priorities'}),dismiss:id=>toggle('dismissed',id)};
}