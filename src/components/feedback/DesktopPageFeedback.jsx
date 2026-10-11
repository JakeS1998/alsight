import React from 'react';
import {MessageSquareText,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import PageFeedbackForm from '@/components/feedback/PageFeedbackForm';
export default function DesktopPageFeedback({route,recent,onSubmitted,revision,onClose}) {
 return <section aria-label="Page Feedback" className="max-h-[calc(100dvh-3rem)] w-80 overflow-y-auto rounded-panel border border-border bg-card p-4 text-card-foreground shadow-lg">
  <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText className="h-5 w-5 text-primary" aria-hidden="true"/>Page Feedback</h2><Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" aria-label="Close page feedback" onClick={onClose}><X className="h-4 w-4"/></Button></div>
  <p className="mb-3 mt-1 text-xs text-muted-foreground">Help improve this page with a quick rating.</p>
  <PageFeedbackForm key={`${route}:${revision}`} route={route} recent={recent} onSubmitted={onSubmitted} compact/>
 </section>;
}