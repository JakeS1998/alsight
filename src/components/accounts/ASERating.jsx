import React from 'react';
import { aseLabel } from '@/components/accounts/accountPresentation';
export default function ASERating({ account, compact = false }) {
  const assessed = typeof account.ase_score === 'number' && account.ase_score >= 1 && account.ase_score <= 5;
  return <div className={`ase-rating ${compact ? 'ase-compact' : ''}`} aria-label={assessed ? `ASE ${account.ase_score} out of 5, ${aseLabel(account.ase_score)}` : 'ASE not assessed'}>
    <svg viewBox="0 0 140 85" aria-hidden="true"><path d="M 15 70 A 55 55 0 0 1 125 70" fill="none" stroke="currentColor" strokeWidth="10" className="ase-track" />{assessed && <><path d="M 15 70 A 55 55 0 0 1 125 70" fill="none" stroke="currentColor" strokeWidth="10" pathLength="5" strokeDasharray={`${account.ase_score} 5`} className={`ase-progress ${account.ase_score < 3 ? 'text-destructive' : account.ase_score < 4 ? 'text-risk-moderate' : 'text-success'}`} /><g transform={`rotate(${-90 + account.ase_score * 36} 70 70)`}><path d="M 70 70 L 70 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><circle cx="70" cy="70" r="4" fill="currentColor" /></g></>}</svg>
    <div><p className="ase-caption">ASE Rating</p><p className="ase-value">{assessed ? `${account.ase_score} / 5` : 'ASE —'}</p><p className="ase-label">{assessed ? aseLabel(account.ase_score) : 'Not assessed'}</p></div>
  </div>;
}