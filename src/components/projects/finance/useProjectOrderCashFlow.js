import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {financeCall} from '@/components/finance/financeClient';
export default function useProjectOrderCashFlow(project, enabled){
 const {user}=useAuth();
 return useQuery({queryKey:['finance','project-order-cash-flow-transaction-spend-v5',user?.id,user?.role,project.id,project.updated_date],enabled,staleTime:60000,refetchOnMount:'always',queryFn:()=>financeCall({action:'projectOrderCashFlow',projectId:project.id})});
}