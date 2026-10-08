import React from 'react';
import {Link} from 'react-router-dom';
import useApprovalSummary from '@/components/approvals/useApprovalSummary';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import approvalClient from '@/components/approvals/approvalClient';
export default function ApprovalActionNotice({onNavigate}) {
 const {user}=useAuth(),summary=useApprovalSummary(),count=summary.data?.pending || 0;
 const preview=useQuery({queryKey:['approval-inbox',user?.id,'notification-preview'],enabled:count>0,queryFn:()=>approvalClient('list',{view:'pending',limit:3}),staleTime:30000,refetchInterval:60000,retry:false});
 if(!count)return null;
 return <div className="mb-3 rounded-lg border-l-2 border-primary bg-primary/5 p-3"><p className="text-xs font-semibold">{count} {count===1 ? 'approval requires' : 'approvals require'} your decision</p>{preview.data?.items.map(request=><Link key={request.id} to={`/approvals?approval=${request.id}`} onClick={onNavigate} className="mt-2 block text-xs text-chart-2 hover:underline"><span className="block font-medium">{request.project_name || request.document_title}</span><span className="text-[10px] text-muted-foreground">{request.approval_type}</span></Link>)}<Link to="/approvals" onClick={onNavigate} className="mt-2 inline-block text-xs font-semibold text-chart-2 underline">Review approvals →</Link></div>;
}