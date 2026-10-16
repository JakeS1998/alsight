import { useEffect, useState } from 'react';
export default function useAdaptiveClock() {
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{const tick=()=>setNow(Date.now()),visible=()=>{if(!document.hidden)tick();};const timer=setInterval(visible,30000);window.addEventListener('focus',tick);document.addEventListener('visibilitychange',visible);return()=>{clearInterval(timer);window.removeEventListener('focus',tick);document.removeEventListener('visibilitychange',visible);};},[]);
 return now;
}