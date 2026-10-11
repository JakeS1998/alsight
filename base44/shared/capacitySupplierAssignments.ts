const normalise=value=>String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const appointmentRoles={appointment_pm:'Project Manager',appointment_pd_cdm:'Principal Designer (CDM)',appointment_pd_br:'Principal Designer (BR)',appointment_architect:'Architect',pcsa:'Contractor'};
const roleName=value=>Object.values(appointmentRoles).find(role=>normalise(role)===normalise(value)) || String(value || 'Delivery supplier').trim();
export async function capacitySupplierAssignments(db,projects,latest,read) {
  const ids=projects.flatMap(project=>[project.id,project.dataverse_id]).filter(Boolean);
  if(!ids.length)return new Map();
  const [documents,contracts]=await Promise.all([
    read('supplier-appointments:v1',()=>db.LegalDocument.aggregate({query:{project_id:{$in:ids},status:{$ne:'inactive'},document_type:{$in:Object.keys(appointmentRoles)}},groupBy:['project_id','account_id','document_type'],limit:1000})),
    read('supplier-contracts:v1',()=>db.JCT.aggregate({query:{project_id:{$in:ids},status:{$ne:'inactive'}},groupBy:['project_id','contractor_id','account_id'],limit:1000})),
  ]);
  if(documents.truncated || contracts.truncated)throw new Error('Supplier assignment reporting exceeds its grouping limit. Narrow the portfolio filters.');
  const references=new Map();
  for(const project of projects){
    const paths=[latest.get(project.id),latest.get(project.dataverse_id)].filter(Boolean).sort((a,b)=>String(b.updated_date).localeCompare(String(a.updated_date)));
    let team=[];
    try{const saved=JSON.parse(paths[0]?.delivery_team || '[]');if(Array.isArray(saved))team=saved.filter(member=>member && member.supplier_company_number);}catch{ /* Invalid saved team provides no allocation evidence. */ }
    const refs=team.map(member=>({number:member.supplier_company_number,role:roleName(member.role)}));
    const projectIds=new Set([project.id,project.dataverse_id].filter(Boolean));
    documents.rows.filter(row=>projectIds.has(row.project_id) && row.account_id).forEach(row=>refs.push({id:row.account_id,role:appointmentRoles[row.document_type]}));
    contracts.rows.filter(row=>projectIds.has(row.project_id) && (row.contractor_id || row.account_id)).forEach(row=>refs.push({id:row.contractor_id || row.account_id,role:'Contractor'}));
    references.set(project.id,refs);
  }
  const refs=[...references.values()].flat(),accountIds=[...new Set(refs.map(ref=>ref.id).filter(Boolean))],numbers=[...new Set(refs.map(ref=>ref.number).filter(Boolean))];
  const accounts=refs.length ? await read('supplier-companies:v1',()=>db.Account.aggregate({query:{$or:[...(accountIds.length ? [{id:{$in:accountIds}},{dataverse_id:{$in:accountIds}}] : []),...(numbers.length ? [{company_number:{$in:numbers}},{ch_company_number:{$in:numbers}}] : [])]},groupBy:'id',max:['name','company_name','company_number','ch_company_number','dataverse_id'],limit:1000})) : {rows:[]};
  if(accounts.truncated)throw new Error('Supplier company reporting exceeds its grouping limit. Narrow the portfolio filters.');
  const byId=new Map(),byNumber=new Map();
  for(const row of accounts.rows){
    const number=row.max_company_number || row.max_ch_company_number;
    const company={key:number ? `company:${normalise(number)}` : row.id,name:row.max_name || row.max_company_name || 'Supplier company not identified',accountId:row.id,resolved:!!(row.max_name || row.max_company_name)};
    [row.id,row.max_dataverse_id].filter(Boolean).forEach(id=>byId.set(normalise(id),company));
    if(number)byNumber.set(normalise(number),company);
  }
  return new Map([...references].map(([projectId,refs])=>{
    const members=new Map();
    for(const ref of refs){
      const company=(ref.id ? byId.get(normalise(ref.id)) : byNumber.get(normalise(ref.number))) || {key:`unresolved:${ref.id || normalise(ref.number)}`,name:'Supplier company not identified',resolved:false};
      const member=members.get(company.key) || {...company,roles:[]};
      if(!member.roles.includes(ref.role))member.roles.push(ref.role);
      members.set(company.key,member);
    }
    return [projectId,[...members.values()]];
  }));
}