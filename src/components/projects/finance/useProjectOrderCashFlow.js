import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {financeCall} from '@/components/finance/financeClient';
export default function useProjectOrderCashFlow(project, enabled){
 const {user}=useAuth();
 return useQuery({queryKey:['finance','project-order-cash-flow',user?.id,user?.role,project.id],enabled,staleTime:60000,queryFn:()=>financeCall({action:'projectOrderCashFlow',projectId:project.id})});
}