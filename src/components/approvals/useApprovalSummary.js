import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import useApprovalAccess from '@/components/approvals/useApprovalAccess';
import approvalClient from '@/components/approvals/approvalClient';
export default function useApprovalSummary() {
 const {user}=useAuth(),access=useApprovalAccess();
 return useQuery({queryKey:['approval-summary',user?.id],enabled:access.enabled,queryFn:()=>approvalClient('summary'),staleTime:30000,refetchInterval:60000,retry:false});
}