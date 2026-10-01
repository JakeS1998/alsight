export const CONTRACTOR_STAGES = ['riba_1', 'riba_2', 'riba_3', 'riba_4', 'riba_5_7'];
export const CONTRACTOR_LABELS = { riba_1: 'RIBA 1', riba_2: 'RIBA 2', riba_3: 'RIBA 3', riba_4: 'RIBA 4', riba_5_7: 'RIBA 5-7' };
export const contractorFeeId = () => crypto.randomUUID();
export function groupContractorFees(fees = []) {
  const groups = new Map();
  fees.forEach(fee => {
    const key = fee.fee_row_id || (fee.type !== 'authorised_activity' && fee.description?.trim()
      ? JSON.stringify([fee.type, fee.supplier || '', fee.description.trim()]) : fee.id);
    if (!groups.has(key)) groups.set(key, { ...fee, id: fee.fee_row_id || fee.id, amounts: {} });
    const row = groups.get(key);
    const stage = fee.type === 'authorised_activity' ? 'riba_5_7' : fee.stage || 'riba_1';
    if (fee.amount !== '' && fee.amount != null) row.amounts[stage] = (Number(row.amounts[stage]) || 0) + (Number(fee.amount) || 0);
  });
  return [...groups.values()];
}
export function flattenContractorRows(rows) {
  return rows.flatMap(({ amounts, ...row }) => {
    const stages = row.type === 'authorised_activity' ? ['riba_5_7'] : CONTRACTOR_STAGES.slice(0, 4);
    const entered = stages.filter(stage => amounts[stage] !== '' && amounts[stage] != null);
    return (entered.length ? entered : [stages[0]]).map(stage => ({ ...row, fee_row_id: row.id,
      id: `${row.id}-${stage}`, stage, amount: amounts[stage] ?? '' }));
  });
}
export function contractorStageBases(member) {
  const amounts = Object.fromEntries(CONTRACTOR_STAGES.map(stage => [stage, 0]));
  if (Array.isArray(member.contractor_fees)) member.contractor_fees.forEach(fee => {
    const stage = fee.type === 'authorised_activity' ? 'riba_5_7' : fee.stage;
    if (stage in amounts) amounts[stage] += Number(fee.amount) || 0;
  });
  else CONTRACTOR_STAGES.forEach(stage => { amounts[stage] = Number(member.fees?.[stage]) || 0; });
  return amounts;
}
export const calculateStageOhp = (base, setting) => setting?.type === 'fixed'
  ? Math.round((Number(setting.value) || 0) * 100) / 100
  : Math.round(base * (Number(setting?.value) || 0)) / 100;