import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loadWellbeing } from '@/components/wellbeing/wellbeingPreferences';
const WellbeingContext=createContext(null);
export const useWellbeing=()=>useContext(WellbeingContext);
export default function WellbeingProvider({user,children}) {
 const key=`alsight-wellbeing-v1:${user?.id}`;
 const [settings,setSettings]=useState(()=>loadWellbeing(user?.id)),[error,setError]=useState('');
 const save=useCallback(changes=>setSettings(old=>{
  const next={...old,...changes,categories:{...old.categories,...changes.categories}};
  try{localStorage.setItem(key,JSON.stringify(next));setError('');}catch{setError('These preferences apply for this session, but could not be saved on this browser.');}
  return next;
 }),[key]);
 useEffect(()=>{const update=e=>{if(e.key===key)setSettings(loadWellbeing(user?.id));};window.addEventListener('storage',update);return()=>window.removeEventListener('storage',update);},[key,user?.id]);
 return <WellbeingContext.Provider value={{settings,save,error,userId:user?.id}}>{children}</WellbeingContext.Provider>;
}