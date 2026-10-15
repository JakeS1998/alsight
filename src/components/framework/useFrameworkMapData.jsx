import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import useProjectMapData from '@/components/projects/useProjectMapData';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
export default function useFrameworkMapData({filters,term,user}) {
 const records=useQuery({queryKey:['framework-workspace','map',user?.id,user?.role,filters,term],enabled:!!user?.id,staleTime:60000,...organisationQueryPolicy,queryFn:async({signal})=>{
  const rows=[];let cursor;
  do {
   signal.throwIfAborted();
   const {data}=await base44.functions.invoke('getStakeholderFrameworkReport',{workspaceAction:'map',filters,term,...(cursor ? {cursor} : {})});
   signal.throwIfAborted();
   if(data.error)throw new Error(data.error);
   rows.push(...data.rows);
   if(!data.has_more)break;
   if(!data.next_cursor || data.next_cursor===cursor)throw new Error('Unable to load all Framework project locations.');
   cursor=data.next_cursor;
  }while(cursor);
  return rows;
 }});
 const portfolio=useMemo(()=>records.data || [],[records.data]);
 const map=useProjectMapData({portfolio,serverPaging:false,externalLoading:records.isPending});
 const points=useMemo(()=>map.located.map(row=>({...row,location:{latitude:row.latitude,longitude:row.longitude}})),[map.located]);
 return {...map,points,error:records.error,retry:records.refetch};
}