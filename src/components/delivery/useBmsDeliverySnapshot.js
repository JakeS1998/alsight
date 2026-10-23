import {useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
export default function useBmsDeliverySnapshot(projectId,delivery) {
 const [snapshot,setSnapshot]=useState(delivery||{});
 useEffect(()=>{setSnapshot(delivery||{});},[projectId,delivery]);
 useEffect(()=>base44.entities.ProjectDelivery.subscribe(event=>{
  if(event.data?.project_id===projectId&&event.type!=='delete')setSnapshot(previous=>({...previous,...event.data}));
 }),[projectId]);
 return snapshot;
}