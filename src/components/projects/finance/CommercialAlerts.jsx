import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function CommercialAlerts({ alerts }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-heading text-base font-semibold text-als-navy">Commercial Attention Required</h3>
      {alerts.length === 0 ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          No priority commercial issues currently require attention.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {alerts.map((a, i) => (
            <Link key={i} to={a.to} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm text-slate-700 hover:bg-amber-50">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="font-medium">{a.label}</span>
              <span className="ml-auto text-xs text-als-navy-light hover:underline">View →</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}