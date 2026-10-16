import {base44} from '@/api/base44Client';
export default async function contactProjectQuery(contact,account){
 const personIds=[contact.id,contact.dataverse_id].filter(Boolean);
 const clauses=['client_rep_id','client_rep2_id','project_manager_id','contractor_contact_id'].map(field=>({[field]:{$in:personIds}}));
 if(!account)return {$or:clauses};
 const accountIds=[account.id,account.dataverse_id].filter(Boolean);
 const sources=[['LegalDocument',['account_id','client_account_id']],['Warranty',['account_id','supplier_id','client_account_id']],['JCT',['account_id','contractor_id','client_account_id']]];
 const pages=await Promise.all(sources.map(([entity,fields])=>base44.entities[entity].filter({$or:fields.map(field=>({[field]:{$in:accountIds}}))},{distinct:'project_id',limit:1000})));
 if(pages.some(page=>page.has_more))throw new Error('This organisation has more linked projects than can currently be resolved. Please contact an administrator.');
 const projectIds=[...new Set(pages.flatMap(page=>page.items).filter(Boolean))];
 clauses.push(...['client_account_id','account_id','related_supplier_account_ids'].map(field=>({[field]:{$in:accountIds}})));
 if(projectIds.length)clauses.push({id:{$in:projectIds}},{dataverse_id:{$in:projectIds}});
 return {$or:clauses};
}