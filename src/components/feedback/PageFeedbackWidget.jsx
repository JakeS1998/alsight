import React,{useEffect,useState} from 'react';
import DesktopPageFeedback from '@/components/feedback/DesktopPageFeedback';
import {MessageSquareText,X} from 'lucide-react';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Popover,PopoverContent,PopoverTrigger} from '@/components/ui/popover';
import {useToast} from '@/components/ui/use-toast';
import PageFeedbackForm from '@/components/feedback/PageFeedbackForm';
import {feedbackCall} from '@/components/feedback/feedbackClient';
export default function PageFeedbackWidget({user,route}) {
 const [open,setOpen]=useState(false),[desktop,setDesktop]=useState(()=>window.matchMedia('(min-width: 1024px)').matches),[revision,setRevision]=useState(0),{toast}=useToast();
 useEffect(()=>{const media=window.matchMedia('(min-width: 1024px)');const update=()=>{setDesktop(media.matches);setOpen(false);};media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 const own=useQuery({queryKey:['page-feedback','own',user.id,route],enabled:open||desktop,staleTime:60000,retry:false,queryFn:()=>feedbackCall({action:'own',page_route:route})});
 const recent=own.data?.submitted_at&&Date.now()-Date.parse(own.data.submitted_at)<30*86400000;
 const submitted=()=>{setOpen(false);setRevision(value=>value+1);toast({title:'Thank you for your feedback.',description:'Your rating has been saved.',duration:3500});};
 return <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:left-6">{desktop?<DesktopPageFeedback route={route} recent={recent} onSubmitted={submitted} revision={revision}/>:<Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button type="button" className="h-auto rounded-full bg-als-navy px-4 py-3 text-sm font-semibold text-sidebar-foreground shadow-lg hover:bg-als-navy-light [&_svg]:size-5" aria-label="Page Feedback" aria-expanded={open}><MessageSquareText className="h-4 w-4 text-primary" aria-hidden="true"/>Page Feedback</Button></PopoverTrigger><PopoverContent side="top" align="start" sideOffset={10} collisionPadding={12} role="dialog" aria-labelledby="page-feedback-title" className="z-40 max-h-[min(70dvh,34rem)] w-[calc(100vw-1.5rem)] max-w-sm overflow-y-auto rounded-panel border-border bg-card p-4 font-body motion-reduce:animate-none"><div className="mb-4 flex items-center justify-between"><h2 id="page-feedback-title" className="font-heading text-base font-semibold">Page Feedback</h2><Button type="button" size="icon" variant="ghost" aria-label="Close page feedback" onClick={()=>setOpen(false)}><X/></Button></div><PageFeedbackForm route={route} onSubmitted={submitted} recent={recent}/></PopoverContent></Popover>}</div>;
}