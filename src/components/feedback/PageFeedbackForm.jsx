import React,{useRef,useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import PageFeedbackRating from '@/components/feedback/PageFeedbackRating';
import {feedbackCall,feedbackCategories} from '@/components/feedback/feedbackClient';
export default function PageFeedbackForm({route,onSubmitted,recent}) {
 const [rating,setRating]=useState(0),[category,setCategory]=useState(''),[comment,setComment]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const lock=useRef(false),token=useRef(crypto.randomUUID()),client=useQueryClient();
 async function submit(event){
  event.preventDefault();if(lock.current||!rating)return;lock.current=true;setBusy(true);setError('');
  try{
   const width=window.innerWidth;
   await feedbackCall({action:'submit',page_route:route,rating,feedback_category:category,comment,device_type:width<768?'mobile':width<1024?'tablet':'desktop',submission_id:token.current});
   client.invalidateQueries({queryKey:['page-feedback']});onSubmitted();
  }catch(e){setError(e.response?.data?.error||e.message||'Feedback could not be saved. Please try again.');}
  finally{lock.current=false;setBusy(false);}
 }
 return <form onSubmit={submit} className="space-y-3">{recent&&<p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">You recently shared feedback on this page. You can still send a new rating.</p>}<PageFeedbackRating rating={rating} onChange={setRating} disabled={busy}/>{rating>0&&<><label htmlFor="feedback-category" className="block text-sm font-medium">What’s the main reason for your rating? <span className="text-xs font-normal text-muted-foreground">(optional)</span></label><select id="feedback-category" value={category} onChange={e=>setCategory(e.target.value)} disabled={busy} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm"><option value="">Choose a reason (optional)</option>{feedbackCategories.map(item=><option key={item}>{item}</option>)}</select><label htmlFor="feedback-comment" className="block text-sm font-medium">Anything else you’d like us to know?</label><Textarea id="feedback-comment" value={comment} onChange={e=>setComment(e.target.value)} maxLength={2000} disabled={busy} rows={3} placeholder="Optional comment…" className="resize-y text-sm"/></>}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full" disabled={!rating||busy}>{busy?'Submitting…':'Submit Feedback'}</Button><p className="text-xs text-muted-foreground">Your feedback is visible only to you and authorised administrators.</p></form>;
}