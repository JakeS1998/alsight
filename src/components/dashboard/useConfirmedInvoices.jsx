import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useConfirmedInvoices(projects, enabled = true) {
  const ids = useMemo(() => projects.map(p => p.id).filter(Boolean), [projects]);
  const [result, setResult] = useState({ amounts: {}, loading: true, error: '' });

  useEffect(() => {
    let active = true;
    if (!enabled || !ids.length) {
      setResult({ amounts: {}, loading: false, error: '' });
      return () => { active = false; };
    }
    setResult(previous => ({ ...previous, loading: true, error: '' }));
    base44.entities.Invoice.aggregate({
      query: { project_id: { $in: ids }, status: 'paid', paid_date: { $gt: '' } },
      groupBy: 'project_id', sum: ['amount'], limit: 1000,
    }).then(({ rows, truncated }) => {
      if (!active) return;
      if (truncated) throw new Error('Invoice totals exceeded the reporting limit.');
      setResult({ amounts: Object.fromEntries(rows.map(row => [row.project_id, Number(row.sum_amount) || 0])), loading: false, error: '' });
    }).catch(() => {
      if (active) setResult({ amounts: {}, loading: false, error: 'Could not load paid invoice totals.' });
    });
    return () => { active = false; };
  }, [ids, enabled]);

  return result;
}