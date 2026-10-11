import React from 'react';
import {MessageSquareText} from 'lucide-react';
import PageFeedbackForm from '@/components/feedback/PageFeedbackForm';
export default function DesktopPageFeedback({route,recent,onSubmitted,revision}) {
 return <section aria-label="Page Feedback" className="max-h-[calc(100dvh-3rem)] w-80 overflow-y-auto rounded-panel border border-border bg-card p-4 text-card-foreground shadow-lg">
  <h2 className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText className="h-5 w-5 text-primary" aria-hidden="true"/>Page Feedback</h2>
  <p className="mb-3 mt-1 text-xs text-muted-foreground">Help improve this page with a quick rating.</p>
  <PageFeedbackForm key={`${route}:${revision}`} route={route} recent={recent} onSubmitted={onSubmitted} compact/>
 </section>;
}