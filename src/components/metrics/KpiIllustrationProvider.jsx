import React, {createContext, useCallback, useMemo, useState} from 'react';
import {artworkCandidates, kpiArtwork} from '@/components/metrics/kpiArtwork';
export const KpiArtworkContext = createContext(null);
export default function KpiIllustrationProvider({children}){
 const [assignments,setAssignments]=useState({});
 const register=useCallback((id,preferred)=>{
  setAssignments(previous=>{
   if(previous[id]?.preferred===preferred)return previous;
   const used=new Set(Object.entries(previous).filter(([key])=>key!==id).map(([,entry])=>entry.src));
   const choice=artworkCandidates(preferred).find(key=>!used.has(kpiArtwork[key]));
   return {...previous,[id]:{preferred,src:choice ? kpiArtwork[choice] : null}};
  });
 },[]);
 const unregister=useCallback(id=>setAssignments(previous=>{
  if(!previous[id])return previous;
  const next={...previous};delete next[id];return next;
 }),[]);
 const value=useMemo(()=>({assignments,register,unregister}),[assignments,register,unregister]);
 return <KpiArtworkContext.Provider value={value}>{children}</KpiArtworkContext.Provider>;
}