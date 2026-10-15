import {frameworkProjectNumber} from './frameworkCommercialValues.ts';
const unique=values=>[...new Set(values.filter(Boolean))];
const normalise=value=>String(value||'').trim().toLowerCase();
async function readPages(entity,query,fields,sort='-updated_date') {
 const rows=[];let cursor;
 do {const page=await entity.filter(query,{fields,sort,limit:100,cursor});rows.push(...page.items);cursor=page.has_more?page.next_cursor:null;}while(cursor);
 return rows;
}
function contractorNumbers(delivery) {
 try {const team=JSON.parse(delivery?.delivery_team||'[]');return Array.isArray(team)?unique(team.filter(member=>normalise(member?.role)==='contractor').map(member=>member.supplier_company_number)):[];}
 catch{return [];}
}
// Call only with report rows already authorised by the reporting endpoint.
// Privileged joins expose contractor names only, never restricted project data.
export async function withFrameworkPrincipalContractors(db,rows) {
 if(!rows.length)return rows;
 const refs=unique(rows.map(row=>row.project_id)),native=refs.filter(id=>/^[a-f0-9]{24}$/i.test(id)),legacy=refs.filter(id=>!/^[a-f0-9]{24}$/i.test(id));
 const numbers=unique(rows.filter(row=>!row.project_id).map(row=>frameworkProjectNumber(row.project_number||row.framework_ref)));
 const clauses=[...(native.length?[{id:{$in:native}}]:[]),...(legacy.length?[{dataverse_id:{$in:legacy}}]:[]),...(numbers.length?[{project_number:{$in:numbers}}]:[])];
 if(!clauses.length)return rows.map(row=>({...row,principal_contractor:null}));
 const projects=await readPages(db.Project,{$or:clauses},['dataverse_id','project_number']);
 const aliases=unique(projects.flatMap(project=>[project.id,project.dataverse_id]));
 if(!aliases.length)return rows.map(row=>({...row,principal_contractor:null}));
 const [deliveries,contracts]=await Promise.all([
  readPages(db.ProjectDelivery,{project_id:{$in:aliases}},['project_id','contractor','delivery_team']),
  db.JCT.aggregate({query:{project_id:{$in:aliases},status:{$ne:'inactive'},contractor_id:{$gt:''}},groupBy:['project_id','contractor_id','executed'],max:'date_of_execution',limit:1000})
 ]);
 if(contracts.truncated)throw new Error('Principal contractor lookup exceeded its reporting limit.');
 const byAlias=new Map(projects.flatMap(project=>[project.id,project.dataverse_id].filter(Boolean).map(id=>[id,project.id]))),latest=new Map();
 for(const delivery of deliveries){const key=byAlias.get(delivery.project_id);if(!latest.has(key))latest.set(key,delivery);}
 const accountRefs=unique(contracts.rows.map(row=>row.contractor_id)),companyNumbers=unique([...latest.values()].flatMap(contractorNumbers));
 const accountClauses=[...(accountRefs.length?[{id:{$in:accountRefs.filter(id=>/^[a-f0-9]{24}$/i.test(id))}},{dataverse_id:{$in:accountRefs}}]:[]),...(companyNumbers.length?[{company_number:{$in:companyNumbers}},{ch_company_number:{$in:companyNumbers}}]:[])];
 const accounts=accountClauses.length?await readPages(db.Account,{$or:accountClauses},['name','company_name','dataverse_id','company_number','ch_company_number']):[];
 const namesById=new Map(),namesByNumber=new Map();
 for(const account of accounts){const name=account.name||account.company_name;if(!name)continue;[account.id,account.dataverse_id].filter(Boolean).forEach(id=>namesById.set(normalise(id),name));[account.company_number,account.ch_company_number].filter(Boolean).forEach(number=>namesByNumber.set(normalise(number),name));}
 const projectNames=new Map();
 for(const project of projects){
  const delivery=latest.get(project.id),teamNames=unique(contractorNumbers(delivery).map(number=>namesByNumber.get(normalise(number))));
  const matches=contracts.rows.filter(row=>byAlias.get(row.project_id)===project.id),signed=matches.filter(row=>normalise(row.executed)==='yes');
  const contractNames=unique((signed.length?signed:matches).map(row=>namesById.get(normalise(row.contractor_id))));
  projectNames.set(project.id,teamNames.join('; ')||contractNames.join('; ')||delivery?.contractor?.trim()||null);
 }
 return rows.map(row=>{const project=row.project_id?projects.find(project=>project.id===row.project_id||project.dataverse_id===row.project_id):projects.find(project=>project.project_number===frameworkProjectNumber(row.project_number||row.framework_ref));return {...row,principal_contractor:projectNames.get(project?.id)||null};});
}