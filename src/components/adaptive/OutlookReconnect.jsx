import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { OUTLOOK_CONNECTOR_ID } from '@/components/outlook/calendarClient';
export default function OutlookReconnect({onConnected}) {
 const [signedIn,setSignedIn]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),timer=useRef(null);
 useEffect(()=>{base44.auth.isAuthenticated().then(setSignedIn);return()=>clearInterval(timer.current);},[]);
 async function connect(){
  const popup=window.open('about:blank','alsight-outlook','width=650,height=760');setBusy(true);setError('');
  try{
   if(!popup)throw Error('Allow pop-ups to connect Outlook.');
   popup.location.href=await base44.connectors.connectAppUser(OUTLOOK_CONNECTOR_ID);
   timer.current=setInterval(()=>{if(popup.closed){clearInterval(timer.current);setBusy(false);onConnected();}},500);
  }catch(e){popup?.close();setBusy(false);setError(e.message);}
 }
 if(signedIn===null)return <p role="status" className="at-small">Checking sign-in…</p>;
 return <div className="space-y-2">{signedIn?<button className="at-btn" disabled={busy} onClick={connect}>{busy?'Waiting for Outlook…':'Connect or renew Outlook'}</button>:<button className="at-btn" onClick={()=>base44.auth.redirectToLogin()}>Sign in to connect Outlook</button>}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}