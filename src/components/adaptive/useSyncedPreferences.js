import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { readPreferenceCache, writePreferenceCache } from '@/components/adaptive/preferenceCache';
export default function useSyncedPreferences(userId,scope,key,fallback) {
 const [value,setValue]=useState(()=>typeof fallback==='function'?fallback():readPreferenceCache(key,fallback)),[baseline,setBaseline]=useState(null),[ready,setReady]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const current=useRef(value),initial=useRef(value),dirty=useRef({}),busy=useRef(false),reading=useRef(false),loaded=useRef(false),mounted=useRef(false),timer=useRef(null),flushRef=useRef(null);
 const apply=useCallback(next=>{current.current=next;if(mounted.current)setValue(next);writePreferenceCache(key,next);},[key]);
 const flush=useCallback(async function persist(){
  if(!userId||!loaded.current||busy.current||!Object.keys(dirty.current).length)return;
  const snapshot={...dirty.current};busy.current=true;if(mounted.current)setSaving(true);let success=false;
  try {
   await base44.entities.WorkspacePreference.upsert(Object.entries(snapshot).map(([name,entry])=>({owner_id:userId,scope,name,setting:{value:entry.value}})),{key:['owner_id','scope','name']});
   for(const name of Object.keys(snapshot))if(dirty.current[name]===snapshot[name])delete dirty.current[name];
   success=true;if(mounted.current)setError('');
  }catch {if(mounted.current)setError('Account sync failed. Changes remain on this device; retry to save them across devices.');}
  finally {busy.current=false;if(mounted.current)setSaving(false);if(success&&Object.keys(dirty.current).length)void persist();}
 },[userId,scope]);
 flushRef.current=flush;
 const refresh=useCallback(async()=>{
  if(!userId||reading.current||busy.current)return;reading.current=true;
  try {
   const page=await base44.entities.WorkspacePreference.filter({owner_id:userId,scope},{limit:50,fields:['name','setting']});
   if(!mounted.current)return;
   const remote={};for(const row of page.items)if(Object.hasOwn(initial.current,row.name)&&row.setting&&Object.hasOwn(row.setting,'value'))remote[row.name]=row.setting.value;
   if(!page.items.length)for(const [name,setting] of Object.entries(current.current))if(!dirty.current[name])dirty.current[name]={value:setting};
   const pending=Object.fromEntries(Object.entries(dirty.current).map(([name,entry])=>[name,entry.value]));
   if(!loaded.current)setBaseline({...initial.current,...remote});
   apply({...current.current,...remote,...pending});loaded.current=true;setReady(true);setError('');await flush();
  }catch {if(mounted.current)setError('Account preferences could not be loaded. Your device settings remain available; retry to sync.');}
  finally {reading.current=false;}
 },[userId,scope,apply,flush]);
 const save=useCallback(changes=>{
  const patch=typeof changes==='function'?changes(current.current):changes;
  for(const [name,setting] of Object.entries(patch))dirty.current[name]={value:setting};
  apply({...current.current,...patch});clearTimeout(timer.current);timer.current=setTimeout(()=>void flushRef.current(),350);
 },[apply]);
 useEffect(()=>{
  mounted.current=true;void refresh();
  const onFocus=()=>void refresh(),onStorage=e=>{if(e.key===key)apply(readPreferenceCache(key,current.current));};
  const unsubscribe=userId?base44.entities.WorkspacePreference.subscribe(event=>{if(!event.data||(event.data.owner_id===userId&&event.data.scope===scope))void refresh();}):()=>{};
  window.addEventListener('focus',onFocus);window.addEventListener('storage',onStorage);
  return()=>{mounted.current=false;clearTimeout(timer.current);void flushRef.current();unsubscribe();window.removeEventListener('focus',onFocus);window.removeEventListener('storage',onStorage);};
 },[userId,scope,key,apply,refresh]);
 return {value,baseline,save,error,ready,saving,retry:refresh};
}