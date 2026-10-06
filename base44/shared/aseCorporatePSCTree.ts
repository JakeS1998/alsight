import {corporatePSCClient,corporatePSC,pscReference} from './aseCorporatePSCSource.ts';
import {pscCandidates} from './aseCorporatePSCCandidates.ts';
import {normaliseCompanyNumber} from './companiesHouseData.ts';
export async function corporatePSCTree(base44,account) {
  const warnings=[],nodes=new Map(),ancestors=[];let number;
  try {number=normaliseCompanyNumber(account.company_number);} catch {return {nodes:[{id:account.id,name:account.name,parentId:null}],currentId:account.id,ancestorIds:[],warnings:['Record a Companies House company number to discover PSC relationships.'],checked_at:null};}
  const client=await corporatePSCClient();
  const ensure=async num=>{if(!nodes.has(num)){const profile=await client.profile(num);nodes.set(num,{id:num,number:num,name:profile.company_name,company_number:num,parentId:null,external:true,source_reference:pscReference(num),source_label:'Companies House PSC'});}return nodes.get(num);};
  const parent=async num=>{const register=await client.psc(num);if(!register.complete)warnings.push(`PSC list truncated for ${num}; no unique parent is inferred.`);const rows=register.items.map(corporatePSC).filter(Boolean),majority=rows.filter(row=>row.majority);return {rows,parent:register.complete && majority.length===1 ? majority[0] : null};};
  const current=await ensure(number);let cursor=number;
  for(let depth=0;depth<6;depth++) {
    const result=await parent(cursor);
    if(!result.parent){if(cursor===number)warnings.push(result.rows.length ? 'Corporate PSCs are recorded, but a unique majority-controlling parent is not established.' : 'No current UK corporate PSC parent is registered; individual PSCs do not establish a group-company parent.');break;}
    const row=result.parent;if(nodes.has(row.number)){warnings.push('Circular PSC control link omitted.');break;}
    const controlling=await ensure(row.number),child=nodes.get(cursor);child.parentId=row.number;child.controls=row.controls;child.notified_on=row.notified_on;child.source_reference=pscReference(cursor);controlling.relationship=depth===0 ? 'Parent · majority corporate PSC' : 'Ancestor · majority corporate PSC';ancestors.push(row.number);cursor=row.number;
    if(depth===5)warnings.push('Parent chain limited to six levels.');
  }
  const groups=[...nodes.values()];let checks=0;
  for(const group of groups.slice(0,6)) {
    const candidates=await pscCandidates(client,group,warnings);
    for(let start=0;start<candidates.length && checks<60;start+=3) {
      const batch=candidates.slice(start,start+Math.min(3,60-checks));checks+=batch.length;
      await Promise.all(batch.map(async candidate=>{
        if(nodes.get(candidate)?.parentId) return;
        try {const register=await parent(candidate),row=register.parent;if(!row || row.number!==group.number || candidate===number && current.parentId!==group.number) return;
          if(ancestors.includes(candidate) || candidate===group.number) return;
          const child=await ensure(candidate);child.parentId=group.number;child.controls=row.controls;child.notified_on=row.notified_on;child.source_reference=pscReference(candidate);
          child.relationship=group.number===number ? 'Subsidiary · majority PSC link' : current.parentId===group.number ? 'Sibling · shared corporate parent' : 'Group company · majority PSC link';
        } catch {warnings.push(`PSC verification unavailable for candidate ${candidate}; its link was not inferred.`);}
      }));
    }
  }
  if(checks>=60)warnings.push('Discovery reached the 60-company verification limit.');
  warnings.push('PSC control bands are not exact shareholdings. Siblings and subsidiaries shown have verified current PSC links; discovery is not an exhaustive group register.');
  const linked=await base44.entities.Account.filter({company_number:{$in:[...nodes.keys()]}},{limit:100,fields:['name','company_number']});
  const ids=new Map([...nodes.keys()].map(num=>[num,num===number ? account.id : 'ch:'+num]));
  for(const node of nodes.values()){const matches=linked.items.filter(row=>row.company_number===node.number);if(node.number===number){node.external=false;}else if(matches.length===1){ids.set(node.number,matches[0].id);node.external=false;}}
  return {nodes:[...nodes.values()].map(node=>({...node,id:ids.get(node.number),parentId:node.parentId ? ids.get(node.parentId) : null})),currentId:account.id,ancestorIds:ancestors.map(num=>ids.get(num)),warnings:[...new Set(warnings)],checked_at:new Date().toISOString()};
}