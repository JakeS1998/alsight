import { flowSpecs } from './dataverseFlowFields.ts';
export function dmaSourceBlanks(settings = {}) {
  const accessFields = ['client_account_id', 'bdm_aad_id', 'bsm_aad_id'];
  return Object.fromEntries(Object.entries(flowSpecs.dma.fields).filter(([key]) => !accessFields.includes(key) && settings.columnPlans?.[key] !== 'base44_only').map(([key, type]) => [key, ['String', 'Memo', 'Lookup'].includes(type) ? '' : null]));
}