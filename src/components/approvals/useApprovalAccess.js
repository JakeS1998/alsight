import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import approvalClient from '@/components/approvals/approvalClient';
export default function useApprovalAccess() {
 const {user}=useAuth();
 const query=useQuery({queryKey:['approval-access',user?.id],queryFn:()=>approvalClient('access'),enabled:!!user?.id,retry:false,staleTime:15000,refetchInterval:60000,refetchOnWindowFocus:true});
 return {...query,enabled:query.data?.enabled===true};
}