import React from 'react';
export default function PathwayStageButton({ stage, index, selected, onSelect }) {
  const Icon = stage.icon;
  return <button type="button" role="tab" id={`pathway-stage-${index}`} aria-controls="pathway-stage-explanation" aria-selected={selected} tabIndex={selected ? 0 : -1} onClick={() => onSelect(index)} className="help-pathway-stage">
    <span className="help-pathway-number">{String(index + 1).padStart(2, '0')}</span>
    <span className="help-pathway-node"><Icon size={26} strokeWidth={1.8} aria-hidden="true" /></span>
    <span className="help-pathway-label">{stage.label}</span>
    <span className="help-pathway-subtitle">{stage.subtitle}</span>
    <ul className="help-pathway-highlights">{stage.highlights.map(text => <li key={text}>{text}</li>)}</ul>
  </button>;
}