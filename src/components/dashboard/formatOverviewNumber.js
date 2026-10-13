export default function formatOverviewNumber(value, currency = true) {
  if (value == null) return value;
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  const magnitude = Math.abs(number);
  const divisor = magnitude >= 1000000 ? 1000000 : magnitude >= 1000 ? 1000 : 1;
  const suffix = divisor === 1000000 ? 'm' : divisor === 1000 ? 'k' : '';
  const formatted = (number / divisor).toLocaleString('en-GB', {
    minimumFractionDigits: suffix ? 1 : 0,
    maximumFractionDigits: suffix ? 1 : 0
  });
  return `${currency ? '£' : ''}${formatted}${suffix}`;
}