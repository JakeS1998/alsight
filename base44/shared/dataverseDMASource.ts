import { flowSpecs } from './dataverseFlowFields.ts';
export function dmaSourceBlanks() {
  const accessFields = ['client_account_id', 'bdm_aad_id', 'bsm_aad_id'];
  return Object.fromEntries(Object.entries(flowSpecs.dma.fields).filter(([key]) => !accessFields.includes(key)).map(([key, type]) => [key, ['String', 'Memo', 'Lookup'].includes(type) ? '' : null]));
}