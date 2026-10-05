import React from 'react';
import { ShieldCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import ASEGauge from '@/components/ase/ASEGauge';
import { formatDate } from '@/lib/portal';
export default function ASEOverviewContent({ current, loading, error }) {
  const ChangeIcon = current?.change > 0 ? TrendingUp : current?.change < 0 ? TrendingDown : Minus;
  return <div className="account-assessment-content">
    <div className="account-assessment-dial">
      <ASEGauge rating={current?.displayed_rating} precise={current?.precise_score} />
      <p className="text-3xl font-bold">{current?.displayed_rating ? `${current.displayed_rating} / 5` : '—'}</p>
      <p className="mt-1 text-sm font-semibold">{loading ? 'Loading…' : error ? 'Unavailable' : current?.rating_label || 'Not assessed'}</p>
      {current?.is_demo && <p className="mt-1 text-xs font-semibold text-primary">Fictional demo</p>}
    </div>
    <div className="min-w-0">
      <div className="account-assessment-explanation"><h3>Why this rating?</h3><p>{current?.explanation || (loading ? 'Loading the latest assessment…' : error ? 'Assessment details are currently unavailable.' : 'No published assessment is available yet.')}</p></div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-2"><ShieldCheck className="h-3.5 w-3.5" />Data confidence: {current?.data_confidence || 'Not assessed'}</span>
        {current?.previous_rating != null && <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-2"><ChangeIcon className="h-3.5 w-3.5" />{current.change ? `${current.change > 0 ? '+' : ''}${current.change} from previous rating` : 'No change'}</span>}
      </div>
      {current?.assessment_date && <p className="mt-3 text-xs text-muted-foreground">Last assessed: {formatDate(current.assessment_date)}</p>}
    </div>
  </div>;
}