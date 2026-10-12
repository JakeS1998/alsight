export default function balanceTrendRows(rows) {
  const origin = rows.length ? Date.parse(rows[0].Date) : 0;
  const xFor = row => (Date.parse(row.Date) - origin) / 86400000;
  const points = rows.filter(row => row.Balance != null && Number.isFinite(Number(row.Balance)) && Number.isFinite(xFor(row)));
  if (points.length < 2) return rows;
  const meanX = points.reduce((sum, row) => sum + xFor(row), 0) / points.length;
  const meanY = points.reduce((sum, row) => sum + Number(row.Balance), 0) / points.length;
  const variance = points.reduce((sum, row) => sum + (xFor(row) - meanX) ** 2, 0);
  if (!variance) return rows;
  const slope = points.reduce((sum, row) => sum + (xFor(row) - meanX) * (Number(row.Balance) - meanY), 0) / variance;
  return rows.map(row => ({ ...row, Trend: Number.isFinite(xFor(row)) ? meanY + slope * (xFor(row) - meanX) : null }));
}