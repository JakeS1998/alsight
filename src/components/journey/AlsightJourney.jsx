import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Crosshair, FileText, FolderKanban, Settings, House } from 'lucide-react';
import '@/components/journey/journey.css';
const steps=[['relationship','Relationship','Build the connection',Users],['opportunity','Opportunity','Shape the opportunity',Crosshair],['fee','Fee','Agree scope & value',FileText],['project','Project','Set up for success',FolderKanban],['delivery','Project Delivery','Deliver with clarity',Settings],['handover','Handover','Here you go',House]];
export default function AlsightJourney({activeStage,links={},statuses={},compact=false}) {
  const active=steps.findIndex(([key])=>key===activeStage);
  return <section className={compact ? 'alsight-journey alsight-journey-compact' : 'alsight-journey'} aria-label="ALSight connected journey">
    <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-sm font-semibold">Projects, People &amp; Information Connected</h2><p className="text-xs text-muted-foreground">From hello to here you go.</p></header>
    <ol className="alsight-journey-steps">{steps.map(([key,label,description,Icon],index)=>{
      const target=links[key],current=activeStage===key;
      const content=<><span className="alsight-journey-icon"><Icon className="h-4 w-4"/></span><span className="min-w-0"><span className="block text-[10px] font-medium text-muted-foreground">{String(index+1).padStart(2,'0')}</span><strong className="block text-xs">{label}</strong><span className="mt-1 block text-[10px] text-muted-foreground">{description}</span><span className="mt-2 block text-[10px] font-semibold">{statuses[key] || (current ? 'Current stage' : active>=0 ? index<active ? 'Earlier stage' : 'Later stage' : target ? 'Explore stage' : 'Select a linked record')}</span></span></>;
      const props={className:'alsight-journey-step','data-current':current,'aria-current':current ? 'step' : undefined};
      return <li key={key}>{typeof target==='function' ? <button type="button" {...props} onClick={target}>{content}</button> : target ? <Link {...props} to={target}>{content}</Link> : <div {...props} aria-disabled="true">{content}</div>}</li>;
    })}</ol>
  </section>;
}