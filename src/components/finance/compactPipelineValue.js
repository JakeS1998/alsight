import { formatCurrency } from '@/lib/portal';
export default function compactPipelineValue(value) {
  const number = typeof value === 'number' ? value : typeof value === 'string' && /^-?£[\d,]+$/.test(value) ? Number(value.replace(/[£,]/g, '')) : null;
  if (number === null) return value;
  if (Math.abs(number) >= 1000000) return `£${(number / 1000000).toLocaleString('en-GB', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}m`;
  return formatCurrency(number);
}