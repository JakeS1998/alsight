import {useEffect} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
export default function useIntelligenceUpdates(recordId,field,entities,keys) {
  const cache=useQueryClient(),entityKey=entities.join(','),queryKey=JSON.stringify(keys);
  useEffect(()=>{let timer;const stops=entityKey.split(',').map(name=>base44.entities[name].subscribe(event=>{if(event.data?.[field]!==recordId && event.type!=='delete')return;clearTimeout(timer);timer=setTimeout(()=>JSON.parse(queryKey).forEach(key=>cache.invalidateQueries({queryKey:key})),300);}));return()=>{clearTimeout(timer);stops.forEach(stop=>stop());};},[recordId,field,entityKey,queryKey,cache]);
}