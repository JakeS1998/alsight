import {mainProjectNumber} from './financeProjectNumberGroups.ts';
export async function directFinanceNumberMatches(base44,rows){
 const codes=[...new Set(rows.map(row=>String(row.Code||'').trim().toUpperCase()))],numbers=[...new Set(codes.map(mainProjectNumber).filter(code=>/^PROJ\d+$/.test(code)&&Number(code.slice(4))>=600))];
 if(!numbers.length)return new Map();
 const page=await base44.asServiceRole.entities.Project.filter({project_number:{$in:numbers}},{limit:500,fields:['project_number','name','dataverse_id']});
 if(page.has_more)throw new Error('Project-number matching batch exceeds its limit.');
 const matches=new Map();
 for(const code of codes){
  const number=mainProjectNumber(code);if(!numbers.includes(number))continue;
  const candidates=page.items.filter(project=>project.project_number===number);if(!candidates.length)continue;
  const unique=candidates.length===1?candidates[0]:null;
  matches.set(code,{project_id:unique?.id||'',project_name:unique?.name||'',project_code:unique?.project_number||'',status:unique?'automatic':'ambiguous',matching_method:'number',candidates:candidates.slice(0,3),linked_by:'Exact ALSight project number (suffix ignored)'});
 }
 return matches;
}