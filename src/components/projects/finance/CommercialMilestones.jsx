import React from 'react';
import { formatDate } from '@/lib/portal';
import { CheckCircle2, Circle } from 'lucide-react';

export default function CommercialMilestones({ milestones }) {
  if (!milestones || milestones.length === 0) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-heading text-base font-semibold text-als-navy">Commercial Milestones</h3>
      <div className="mt-3 space-y-2">
        {milestones.map((m, i) => {
          const done = m.done;
          return (
            <div key={i} className="flex items-center gap-3 text-sm">
              {done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <Circle className="h-4 w-4 shrink-0 text-slate-300" />}
              <span className={`font-medium ${done ? 'text-slate-900' : 'text-slate-500'}`}>{m.label}</span>
              <span className={`ml-auto text-xs ${done ? 'text-slate-500' : 'text-slate-400'}`}>{m.date ? formatDate(m.date) : 'Date not recorded'}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}