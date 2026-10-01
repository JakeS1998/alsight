export const RISK_HEAT_BANDS = [
  { max: 4, label: 'Low', range: '1–4', rowClass: 'bg-risk-low/10 hover:bg-risk-low/20', badgeClass: 'bg-risk-low/25', cellClass: 'bg-risk-low/25' },
  { max: 9, label: 'Moderate', range: '5–9', rowClass: 'bg-risk-moderate/10 hover:bg-risk-moderate/20', badgeClass: 'bg-risk-moderate/30', cellClass: 'bg-risk-moderate/30' },
  { max: 14, label: 'Elevated', range: '10–14', rowClass: 'bg-risk-elevated/10 hover:bg-risk-elevated/20', badgeClass: 'bg-risk-elevated/30', cellClass: 'bg-risk-elevated/30' },
  { max: 19, label: 'High', range: '15–19', rowClass: 'bg-risk-high/10 hover:bg-risk-high/20', badgeClass: 'bg-risk-high/30', cellClass: 'bg-risk-high/30' },
  { max: 25, label: 'Critical', range: '20–25', rowClass: 'bg-risk-critical/10 hover:bg-risk-critical/20', badgeClass: 'bg-risk-critical/25', cellClass: 'bg-risk-critical/25' },
];
const unscored = { label: 'Unscored', range: '', rowClass: 'bg-muted/20 hover:bg-muted/40', badgeClass: 'bg-muted', cellClass: 'bg-muted' };
export function riskHeat(index) {
  const score = Number(index);
  return Number.isInteger(score) && score >= 1 && score <= 25 ? RISK_HEAT_BANDS.find(band => score <= band.max) : unscored;
}