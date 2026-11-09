export const reportStyle = { navy: '102642', orange: 'F59929', pale: 'EAF4FB', muted: '5F7586', border: 'D8E5EE' };
export const reportDate = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
export function reportValue(value, format = 'text') {
  if (value === null || value === undefined) return 'Not recorded';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (format === 'gbp') return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
    if (format === 'percent') return new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 2 }).format(value);
    return new Intl.NumberFormat('en-GB', { maximumFractionDigits: format === 'integer' ? 0 : 6 }).format(value);
  }
  return String(value);
}