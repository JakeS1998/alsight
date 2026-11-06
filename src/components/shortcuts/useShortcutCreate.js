import {useEffect,useRef} from 'react';
import {useSearchParams} from 'react-router-dom';
export default function useShortcutCreate(action,allowed,onOpen){
 const [params,setParams]=useSearchParams(),open=useRef(onOpen);
 open.current=onOpen;
 const requested=params.get('shortcut');
 useEffect(()=>{
  if(requested!==action)return;
  if(allowed)open.current();
  setParams(current=>{const next=new URLSearchParams(current);next.delete('shortcut');return next;},{replace:true});
 },[requested,action,allowed,setParams]);
}