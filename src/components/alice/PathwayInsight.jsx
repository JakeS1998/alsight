import React from 'react';
import AliceInsight from '@/components/alice/AliceInsight';
export default function PathwayInsight({ stages, loading, error, onSelect }) {
  if (loading) return <p role="status" className="text-sm text-muted-foreground">Loading ALICE Insight…</p>;
  if (error) return <AliceInsight statements={[{ text: 'Register information is unavailable; Pathway interpretation is incomplete.' }]} />;
  const current = stages.find(s => !s.complete) || stages[stages.length - 1];
  const statements = [{ text: `${stages.filter(s => s.complete).length} of ${stages.length} Pathway stages meet their recorded completion rules.` }, { text: `The first incomplete stage is ${current.label}: ${current.status}. This is not a separate authorisation to progress.` }];
  const outstanding = current.checks?.filter(c => !c.done).length;
  if (outstanding) statements.push({ text: `${outstanding} recorded completion ${outstanding === 1 ? 'requirement remains' : 'requirements remain'} outstanding in this stage.` });
  return <AliceInsight statements={statements} evidence={stages.map(s => ({ text: `${String(s.id).padStart(2, '0')} ${s.label} — ${s.status}${s.explanation ? ` — ${s.explanation}` : ''}` }))} detail="Statuses explain existing completion indicators. Not Started means no recorded progress indicator; In Progress means at least one indicator is present; Complete means the existing completion rule is met; Complete with Conditions means that rule is met but a displayed check remains outstanding. Blocked is reserved for an explicit blocked gateway, not inferred from an incomplete checklist.">
    <button type="button" onClick={() => onSelect(current.id)} className="mt-2 text-xs text-als-navy-light hover:underline">View {current.label} evidence</button>
  </AliceInsight>;
}