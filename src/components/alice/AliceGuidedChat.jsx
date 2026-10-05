import React, { useEffect, useRef } from 'react';
import AliceGuideInput from '@/components/alice/AliceGuideInput';
import { GUIDES } from '@/components/alice/aliceGuides';
import AliceValuationTask from '@/components/alice/AliceValuationTask';

export default function AliceGuidedChat({ guide, onNext, onBack, onConfirm, onCancel }) {
  const bottom = useRef(null);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [guide.transcript]);
  if (guide.type === 'valuation' && guide.step === 1) return <AliceValuationTask selectedProject={guide.answers.project_id} onBack={onBack} onCancel={onCancel} />;
  return <div className="flex min-h-0 flex-1 flex-col">
    <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-2 text-xs font-semibold text-foreground"><span>{GUIDES[guide.type].label}</span><span className="text-muted-foreground">{guide.result ? 'Done' : guide.step >= GUIDES[guide.type].steps.length ? 'Review' : `${guide.step + 1} of ${GUIDES[guide.type].steps.length}`}</span></div>
    <div aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
      {guide.transcript.map((message, i) => <div key={i} className={message.role === 'user' ? 'ml-10 rounded-xl bg-primary/15 px-3 py-2 text-sm' : 'mr-10 rounded-xl bg-secondary px-3 py-2 text-sm'}>{message.content}</div>)}
      <div ref={bottom} />
    </div>
    <AliceGuideInput guide={guide} onNext={onNext} onBack={onBack} onConfirm={onConfirm} onCancel={onCancel} />
  </div>;
}