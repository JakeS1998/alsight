import React, { useRef, useState } from 'react';
import Logo from '@/components/Logo';
import PathwayStageButton from '@/components/help/PathwayStageButton';
import PathwayStageExplanation from '@/components/help/PathwayStageExplanation';
import { pathwayStagePresentation } from '@/components/help/pathwayStagePresentation';
import { pathwayHelpArticles } from '@/components/help/pathwayHelpContent';
import '@/components/help/pathway.css';

export default function InteractivePathway() {
  const [selected, setSelected] = useState(0);
  const track = useRef(null);
  const onKeyDown = event => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 9 : (selected + (event.key === 'ArrowRight' ? 1 : 9)) % 10;
    setSelected(next);
    track.current.querySelector(`#pathway-stage-${next}`)?.focus();
  };
  return <div className="mt-4 space-y-5">
    <div className="help-pathway-masthead">
      <Logo className="help-pathway-brand h-16" />
      <div className="help-pathway-title"><h3>Project <span>Pathway</span></h3><p>10 connected stages from opportunity to handover</p></div>
      <p className="help-pathway-intro">A structured and consistent approach to delivering successful projects, bringing together commercial, legal, design and delivery activity in one connected view.</p>
    </div>
    <p className="text-xs text-muted-foreground">Select a stage to explore its purpose, steps and important checks. On smaller screens, scroll across to see all ten stages.</p>
    <div className="help-pathway-scroll">
      <div ref={track} role="tablist" aria-label="Project Pathway stages" aria-orientation="horizontal" className="help-pathway-track" onKeyDown={onKeyDown}>
        {pathwayStagePresentation.map((stage, index) => <PathwayStageButton key={stage.label} stage={stage} index={index} selected={selected === index} onSelect={setSelected} />)}
      </div>
    </div>
    <PathwayStageExplanation article={pathwayHelpArticles[selected]} index={selected} />
  </div>;
}