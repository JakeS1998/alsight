import agreementNames from '@/components/projects/agreementNames';

export const AGREEMENT_FEE_ROUTES = {
  dma: 'DMA',
  equipment_only: 'Equipment-only Agreement',
  single_task: 'Single-task Agreement',
};

export default function frameworkAgreementRoute(legalDocs = [], dmas = [], projectNumber) {
  const names = agreementNames(projectNumber);
  if (legalDocs.some(doc => doc.document_type === 'access_agreement')) {
    return dmas.length > 0
      ? { route: 'dma', message: '' }
      : { route: null, message: `${names.developmentShort} fees are payable under the ${names.development}. Link the ${names.developmentShort} before calculating this fee.` };
  }
  const equipment = legalDocs.some(doc => doc.document_type === 'equipment_only_agreement');
  const single = legalDocs.some(doc => doc.document_type === 'single_task_agreement');
  if (equipment && single) return { route: null, message: 'Both alternative agreement types are linked. Confirm the applicable agreement and remove the incorrect agreement type before calculating fees.' };
  if (equipment || single) return { route: equipment ? 'equipment_only' : 'single_task', message: '' };
  return { route: null, message: `No ${names.access} is linked. Add an Equipment-only Agreement or Single-task Agreement in Documents to determine the fee bands.` };
}