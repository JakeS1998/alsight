import {useEffect,useState} from 'react';
export default function useReviewSession(user) {
 const key=`alsight-project-review:${user?.id}`;
 const [session,setSession]=useState(()=>JSON.parse(sessionStorage.getItem(key)||'null') || {id:crypto.randomUUID(),reviewed:[],actions:0,completed:0,notes:0});
 useEffect(()=>{sessionStorage.setItem(key,JSON.stringify(session));},[key,session]);
 const reviewed=id=>setSession(s=>({...s,reviewed:s.reviewed.includes(id) ? s.reviewed : [...s.reviewed,id]}));
 const record=kind=>setSession(s=>({...s,[kind]:(s[kind]||0)+1}));
 return {session,reviewed,record};
}