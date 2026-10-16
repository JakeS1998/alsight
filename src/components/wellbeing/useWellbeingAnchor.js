import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
export default function useWellbeingAnchor(ready=true) {
 const {hash}=useLocation();
 useEffect(()=>{if(ready&&['#adaptive-wrap-up','#wellbeing-settings-title'].includes(hash))document.getElementById(hash.slice(1))?.scrollIntoView({behavior:'auto',block:'start'});},[hash,ready]);
}