import {blackflagSnapshot} from './aseBlackflagSnapshot.ts';
import {blackflagStructure} from './aseBlackflagStructure.ts';
const fields=['name','dataverse_id','parent_account_id','company_number','organisation_type'];
export async function groupStructure(base44,account) {
  const warnings=[],seen=new Set([account.id]),ancestors=[];
  let root=account;
  for(let depth=0;root.parent_account_id && depth<20;depth++) {
    const ref=root.parent_account_id;
    const [ids,legacy]=await Promise.all([base44.entities.Account.filter({id:ref},{limit:2,fields}),base44.entities.Account.filter({dataverse_id:ref},{limit:2,fields})]);
    const matches=[...new Map([...ids.items,...legacy.items].map(row=>[row.id,row])).values()];
    if(matches.length!==1) {warnings.push(matches.length ? 'A recorded parent matches multiple accessible accounts; this branch was not inferred.' : 'A recorded parent is missing or not accessible. The visible group may be disconnected.');break;}
    if(seen.has(matches[0].id)) {warnings.push('A circular parent relationship was detected and stopped.');break;}
    ancestors.push(matches[0].id);seen.add(matches[0].id);root=matches[0];
    if(depth===19 && root.parent_account_id) warnings.push('Parent discovery reached the 20-level limit.');
  }
  const nodes=[{id:root.id,name:root.name,company_number:root.company_number,parentId:null}],visited=new Set([root.id]);
  let frontier=[root];
  for(let depth=0;frontier.length && depth<20;depth++) {
    const aliases=new Map();
    for(const row of frontier) for(const key of [row.id,row.dataverse_id].filter(Boolean)) aliases.set(key,[...(aliases.get(key) || []),row.id]);
    const page=await base44.entities.Account.filter({parent_account_id:{$in:[...aliases.keys()]}},{sort:'name',limit:100,fields});
    if(page.has_more) warnings.push('A group level exceeds the 100-account limit; additional branches are not shown.');
    const next=[];
    for(const row of page.items) {
      const parents=aliases.get(row.parent_account_id) || [];
      if(parents.length!==1) {warnings.push('An ambiguous legacy parent identifier was found; the branch was omitted.');continue;}
      if(visited.has(row.id)) {warnings.push('A circular group relationship was omitted.');continue;}
      if(nodes.length>=100) {warnings.push('The group exceeds the 100-account display limit.');break;}
      visited.add(row.id);nodes.push({id:row.id,name:row.name,company_number:row.company_number,parentId:parents[0]});next.push(row);
    }
    frontier=next;
    if(nodes.length>=100) break;
    if(depth===19 && frontier.length) warnings.push('Subsidiary discovery reached the 20-level limit.');
  }
  if(!visited.has(account.id)) {nodes.push({id:account.id,name:account.name,company_number:account.company_number,parentId:null});warnings.push('This account could not be connected to the accessible group tree.');}
  const report=await blackflagSnapshot(base44,account);
  blackflagStructure(nodes,account.id,report,ancestors,warnings);
  return {nodes,currentId:account.id,ancestorIds:ancestors,warnings:[...new Set(warnings)],checked_at:new Date().toISOString()};
}