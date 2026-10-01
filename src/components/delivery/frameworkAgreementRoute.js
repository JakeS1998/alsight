export const AGREEMENT_FEE_ROUTES = {
  dma: 'DMA',
  equipment_only: 'Equipment-only Agreement',
  single_task: 'Single-task Agreement',
};

export default function frameworkAgreementRoute(legalDocs = [], dmas = []) {
  const active = legalDocs.filter(doc => doc.status !== 'inactive');
  if (active.some(doc => doc.document_type === 'access_agreement')) {
    return dmas.some(doc => doc.status !== 'inactive')
      ? { route: 'dma', message: '' }
      : { route: null, message: 'DMA fees are payable under the DMA. Link the DMA before calculating this fee.' };
  }
  const equipment = active.some(doc => doc.document_type === 'equipment_only_agreement');
  const single = active.some(doc => doc.document_type === 'single_task_agreement');
  if (equipment && single) return { route: null, message: 'Both alternative agreement types are linked. Confirm the applicable agreement and mark the other inactive before calculating fees.' };
  if (equipment || single) return { route: equipment ? 'equipment_only' : 'single_task', message: '' };
  return { route: null, message: 'No Access Agreement is linked. Add an Equipment-only Agreement or Single-task Agreement in Documents to determine the fee bands.' };
}