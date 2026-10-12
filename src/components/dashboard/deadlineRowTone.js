import { plannerDay } from '@/components/dashboard/plannerDates';

export default function deadlineRowTone(row, now = Date.now()) {
  if (row.kind !== 'role' || row.ended) return null;
  const dueDay = row.sort?.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDay || '')) return null;
  const days = Math.round((Date.parse(`${dueDay}T00:00:00Z`) - Date.parse(`${plannerDay(now)}T00:00:00Z`)) / 86400000);
  if (!Number.isFinite(days)) return null;
  const label = days < 0 ? `Overdue by ${Math.abs(days)} day${days === -1 ? '' : 's'}` : days === 0 ? 'Due today' : `Due in ${days} day${days === 1 ? '' : 's'}`;
  const className = days <= 0 ? 'border-risk-critical/40 bg-risk-critical/10' : days <= 2 ? 'border-risk-high/40 bg-risk-high/10' : days <= 4 ? 'border-risk-moderate/50 bg-risk-moderate/10' : 'border-risk-low/40 bg-risk-low/10';
  return { className, label };
}