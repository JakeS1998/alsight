const labels = { survey: 'Survey', consultant: 'Consultant', authorised_activity: 'Authorised activity' };
export default function proposalSupplierGroups(lines, supplierName) {
  const groups = { consultant: new Map(), survey: new Map(), authorised_activity: new Map(), delivery: new Map() };
  const stages = ['RIBA 1', 'RIBA 2', 'RIBA 3', 'RIBA 4', 'RIBA 5-7'];
  lines.forEach(line => {
    const role = line.role || 'Supplier';
    const category = groups[line.fee_category] ? line.fee_category
      : /contractor/i.test(role) ? (line.riba_stage === 'RIBA 5-7' ? 'authorised_activity' : 'survey')
      : /architect|structural engineer|m&e engineer|consultant/i.test(role) ? 'consultant' : 'delivery';
    const name = line.item_description || (line.fee_category ? labels[category] : role);
    const supplier = line.supplier_company_number ? supplierName(line.supplier_company_number) : '';
    const detail = [supplier, line.fee_category ? 'Contractor-appointed' : ''].filter(Boolean).join(' · ');
    const key = JSON.stringify([name, supplier, role]);
    const group = groups[category];
    if (!group.has(key)) group.set(key, { name, role: detail, amounts: Array(6).fill(0) });
    const stage = stages.indexOf(line.riba_stage);
    group.get(key).amounts[stage < 0 ? 5 : stage] += Number(line.supplier_fee) || 0;
  });
  return Object.fromEntries(Object.entries(groups).map(([key, rows]) => [key, [...rows.values()]]));
}