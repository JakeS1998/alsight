import React,{useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/forms/form-dialog';
import {useToast} from '@/components/ui/use-toast';
import PageFeedbackForm from '@/components/feedback/PageFeedbackForm';
import {feedbackCall} from '@/components/feedback/feedbackClient';
import SubmissionSummary from '@/components/forms/SubmissionSummary';
const selectedRefresh=performance.getEntriesByType('navigation')[0]?.type==='reload'&&Math.random()<0.1;
let refreshPromptUsed=false;
export default function PageFeedbackWidget({user,route}) {
 const [open,setOpen]=useState(false),[revision,setRevision]=useState(0),{toast}=useToast();
 useEffect(()=>{setOpen(false);},[route]);
 useEffect(()=>{const show=()=>setOpen(true);window.addEventListener('als-open-page-feedback',show);if(selectedRefresh&&!refreshPromptUsed){refreshPromptUsed=true;setOpen(true);}return()=>window.removeEventListener('als-open-page-feedback',show);},[]);
 const own=useQuery({queryKey:['page-feedback','own',user.id,route],enabled:open,staleTime:60000,retry:false,queryFn:()=>feedbackCall({action:'own',page_route:route})});
 const recent=own.data?.submitted_at&&Date.now()-Date.parse(own.data.submitted_at)<30*86400000;
 const submitted=details=>{setOpen(false);setRevision(value=>value+1);toast({title:'Thank you for your feedback.',description:<SubmissionSummary rows={[[ 'Page',details.page_route],['Rating',`${details.rating} / 5`],['Reason',details.feedback_category],['Comment',details.comment]]}/>,duration:12000});};
 return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85dvh] w-[calc(100vw-2rem)] max-w-sm overflow-y-auto rounded-panel bg-card text-card-foreground"><DialogHeader><DialogTitle>Page Feedback</DialogTitle><DialogDescription>Help improve this page with a quick rating.</DialogDescription></DialogHeader><PageFeedbackForm key={`${route}:${revision}`} route={route} onSubmitted={submitted} recent={recent}/></DialogContent></Dialog>;
}