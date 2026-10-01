export const isAlsFeeLine = line => /^ALS(?: Delivery)? fee$/i.test((line.description || '').trim());
export const isClientFeeLine = line => line.include_on_client !== false;

export function feeProposalTotals(supplierLines, feeLines, contractorBuildUp) {
  const rawSupplierFees = supplierLines.reduce((sum, line) => sum + (Number(line.supplier_fee) || 0), 0);
  const contractorAdjustment = contractorBuildUp && contractorBuildUp.hasContractor
    ? contractorBuildUp.total - contractorBuildUp.rawTotal
    : 0;
  const supplierFees = rawSupplierFees + contractorAdjustment;
  const alsFee = feeLines.filter(isAlsFeeLine).reduce((sum, line) => sum + (Number(line.internal_fee) || 0), 0);
  const otherInternalFees = feeLines.filter(line => !isAlsFeeLine(line)).reduce((sum, line) => sum + (Number(line.internal_fee) || 0), 0);
  const clientLines = feeLines.filter(isClientFeeLine);
  const clientFeeLines = clientLines.reduce((sum, line) => sum + (Number(line.internal_fee) || 0), 0);
  const clientAlsFee = clientLines.filter(isAlsFeeLine).reduce((sum, line) => sum + (Number(line.internal_fee) || 0), 0);
  const proposedFees = supplierFees + clientFeeLines;
  return { supplierFees, alsFee, otherInternalFees, proposedFees, alsFeePct: proposedFees > 0 ? Math.round(clientAlsFee / proposedFees * 1000) / 10 : null };
}