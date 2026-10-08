import {useInfiniteQuery} from '@tanstack/react-query';
import approvalClient from '@/components/approvals/approvalClient';
import {useAuth} from '@/lib/AuthContext';
export default function useApprovalInbox(view,enabled,filters={}) {
 const {user}=useAuth();
 return useInfiniteQuery({queryKey:['approval-inbox',user?.id,view,filters],initialPageParam:null,enabled,retry:false,refetchOnWindowFocus:true,refetchInterval:60000,queryFn:({pageParam})=>approvalClient('list',{view,...filters,...(pageParam ? {cursor:pageParam} : {})}),getNextPageParam:page=>page.has_more ? page.next_cursor : undefined});
}