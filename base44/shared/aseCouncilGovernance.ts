import {collectCouncilRegisters} from './aseCouncilRegisters.ts';
import {discoverGovernanceDocuments} from './aseGovernanceDiscovery.ts';
export async function retrieveCouncilGovernance(account,code,refresh,base44) {
  const page=await base44.entities.ASESourceRefresh.filter({account_id:account.id,source_key:'local_authority',identifier:code,status:{$in:['completed','partial']}},{sort:'-refreshed_at',limit:1,fields:['summary']});
  const officialName=page.items[0]?.summary?.authority_name || '';
  const [registers,documents]=await Promise.all([collectCouncilRegisters(account,code,refresh,officialName),discoverGovernanceDocuments(account,code,refresh,officialName)]);
  if(!Object.keys(registers.raw).length) throw new Error('Official council registers could not be retrieved. '+registers.warnings.join(' ').slice(0,600));
  const warnings=[...registers.warnings,...documents.warnings,'Register entries and discovered documents require administrator verification. Missing matches are not a clean result. Backstop-only audit disclaimers remain context, not a scored governance failure.'];
  if(!officialName) warnings.push('No saved ONS-matched revenue return is available; collection uses the full recorded council name. Confirm council identity during review.');
  return {facts:[...registers.facts,...documents.facts],raw:{authority_code:code,recorded_name:account.name,return_name:officialName,registers:registers.raw,documents:documents.raw},summary:{authority_code:code,authority_name:officialName || account.name,intervention_entries:registers.raw.intervention_register?.matches.length ?? null,backstop_entries:registers.raw.backstop_register?.matches.length ?? null,primary_document_candidates:documents.facts.length,verification_status:'Administrator review required'},warnings};
}