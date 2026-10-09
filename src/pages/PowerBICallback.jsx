import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import powerBIConnectionCall from '@/components/finance/powerBIConnectionClient';
export default function PowerBICallback(){
 const started=useRef(false),[error,setError]=useState('');
 useEffect(()=>{if(started.current)return;started.current=true;const params=new URLSearchParams(window.location.search),code=params.get('code'),state=params.get('state'),denied=params.get('error');window.history.replaceState(null,'',window.location.pathname);if(denied||!code||!state){setError(denied==='access_denied'?'Microsoft sign-in was cancelled or consent was declined.':'Microsoft could not complete sign-in. Ask IT to check delegated permissions and the registered Web return address.');return;}powerBIConnectionCall('finish',{code,state}).then(()=>window.location.replace('/admin/finance')).catch(e=>setError(e.message));},[]);
 return <main className="mx-auto my-12 max-w-xl space-y-4 rounded-panel border border-border bg-card p-6"><h1 className="font-heading text-xl font-semibold">Connect Power BI</h1>{error?<><p role="alert" className="text-destructive">{error}</p><Button asChild><Link to="/admin/finance">Return to Finance reporting setup</Link></Button></>:<p role="status" className="animate-pulse text-muted-foreground">Completing Microsoft sign-in…</p>}</main>;
}