import {useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {financeCall} from '@/components/finance/financeClient';
export default function useProjectFinanceOrders(project){
 const {user}=useAuth(),[cursor,setCursor]=useState(null);
 const enabled=!!project.id&&['admin','director','regional_director','bsm','finance','bdm'].includes(user?.role);
 useEffect(()=>setCursor(null),[project.id]);
 const query=useQuery({queryKey:['finance','project-orders',user?.id,user?.role,project.id,cursor],queryFn:()=>financeCall({action:'projectOrders',projectId:project.id,cursor}),enabled,staleTime:60000});
 return {...query,enabled,cursor,setCursor};
}