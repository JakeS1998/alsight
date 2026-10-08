import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {useAuth} from '@/lib/AuthContext';
import approvalClient from '@/components/approvals/approvalClient';
import ApprovalOverview from '@/components/approvals/ApprovalOverview.jsx';
import ApprovalDocuments from '@/components/approvals/ApprovalDocuments.jsx';
import ApprovalHistory from '@/components/approvals/ApprovalHistory.jsx';
import ApprovalDecisionActions from '@/components/approvals/ApprovalDecisionActions.jsx';
export default function ApprovalDetailPanel({id,onClose}) {
 const {user}=useAuth(),[tab,setTab]=useState('overview');
 const detail=useQuery({queryKey:['approval-detail',user?.id,id],queryFn:()=>approvalClient('detail',{requestId:id}),retry:false,refetchInterval:60000});
 if(detail.isPending)return <section className="rounded-lg border border-border bg-card p-6"><Button variant="ghost" onClick={onClose}>Close</Button><p role="status" className="text-sm">Loading approval…</p></section>;
 if(detail.error)return <section className="rounded-lg border border-border bg-card p-6"><Button variant="ghost" onClick={onClose}>Close</Button><p role="alert" className="text-sm text-destructive">{detail.error.response?.data?.error || detail.error.message}</p><Button variant="outline" className="mt-3" onClick={()=>detail.refetch()}>Try again</Button></section>;
 const request=detail.data.request;
 return <section className="rounded-lg border border-border bg-card p-4 sm:p-5"><header className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-heading text-base font-bold">{request.project_name || request.document_title}</h2><p className="mt-1 text-xs text-muted-foreground">{[request.project_number,request.client_name].filter(Boolean).join(' | ')}</p><p className="mt-2 text-xs font-medium">{request.document_title}</p><span className="mt-2 inline-block rounded-md bg-secondary px-2 py-1 text-[10px]">{request.approval_type}</span></div><Button size="icon" variant="ghost" onClick={onClose} aria-label="Close approval"><X/></Button></header>{request.project_id && <Link className="mt-3 inline-block text-xs font-semibold text-chart-2 underline" to={`/projects/${request.project_id}`}>View project →</Link>}<Tabs value={tab} onValueChange={setTab} className="mt-4"><TabsList className="w-full justify-start"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="documents">Documents ({detail.data.documents.length})</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList><TabsContent value="overview" className="pt-3"><ApprovalOverview request={request}/></TabsContent><TabsContent value="documents" className="pt-3"><ApprovalDocuments documents={detail.data.documents}/></TabsContent><TabsContent value="history" className="pt-3"><ApprovalHistory key={JSON.stringify(detail.data.history.map(v=>v.id))} detail={detail.data}/></TabsContent></Tabs><ApprovalDecisionActions key={request.id} request={request}/></section>;
}