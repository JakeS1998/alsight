export const isAlsFeeLine = line => /^ALS(?: Delivery)? fee$/i.test((line.description || '').trim());

export function feeProposalTotals(supplierLines, feeLines) {
  const supplierFees = supplierLines.reduce((sum, line) => sum + (Number(line.supplier_fee) || 0), 0);
  const alsFee = feeLines.filter(isAlsFeeLine).reduce((sum, line) => sum + (Number(line.internal_fee) || 0), 0);
  const otherInternalFees = feeLines.filter(line => !isAlsFeeLine(line)).reduce((sum, line) => sum + (Number(line.internal_fee) || 0), 0);
  const proposedFees = supplierFees + alsFee;
  return { supplierFees, alsFee, otherInternalFees, proposedFees, alsFeePct: proposedFees > 0 ? Math.round(alsFee / proposedFees * 1000) / 10 : null };
}