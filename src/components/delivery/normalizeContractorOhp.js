import { CONTRACTOR_STAGES, contractorStageBases } from '@/components/delivery/contractorFeeRows';
// Convert previously opted-out contractors to editable stage settings without losing existing OHP totals.
export default function normalizeContractorOhp(team = [], { surveysPct = 0, riba57Pct = 0, surveysType = 'percentage', surveysFixed = 0 } = {}) {
  const legacy = [];
  const next = team.map((member, index) => {
    if (String(member.role || '').trim().toLowerCase() !== 'contractor') return member;
    if (member.contractor_ohp !== null) return { ...member, contractor_ohp: member.contractor_ohp || {} };
    legacy.push({ index, bases: contractorStageBases(member) });
    return { ...member, contractor_ohp: Object.fromEntries(CONTRACTOR_STAGES.map(stage => [stage, { type: stage !== 'riba_5_7' && surveysType === 'fixed' ? 'fixed' : 'percentage', value: stage === 'riba_5_7' ? Number(riba57Pct) || 0 : Number(surveysPct) || 0 }])) };
  });
  if (surveysType === 'fixed' && legacy.length) {
    const cells = legacy.flatMap(({ index, bases }) => CONTRACTOR_STAGES.slice(0, 4).map(stage => ({ index, stage, base: bases[stage] })));
    const base = cells.reduce((sum, cell) => sum + cell.base, 0);
    const last = [...cells].reverse().find(cell => cell.base > 0) || cells[0];
    const totalCents = Math.round((Number(surveysFixed) || 0) * 100);
    let allocated = 0;
    cells.forEach(cell => {
      if (cell === last) return;
      const cents = base ? Math.round(totalCents * cell.base / base) : 0;
      allocated += cents;
      next[cell.index].contractor_ohp[cell.stage] = { type: 'fixed', value: cents / 100 };
    });
    next[last.index].contractor_ohp[last.stage] = { type: 'fixed', value: (totalCents - allocated) / 100 };
  }
  return next;
}