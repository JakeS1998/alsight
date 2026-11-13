import {fail} from './coCore.ts';
export async function contingencyProjects(b,u,m,i,input){
 if(['client','supplier','framework_stakeholder'].includes(u.role))fail('The contingency project directory is for internal users.',403);

 if(input.cursor&&(typeof input.cursor!=='string'||input.cursor.length>10000))fail('Invalid project page.');
 const fields=['id','project_number','name','client_name','status','live_project','legal_status','approval_status','updated_date'];
 const page=await b.asServiceRole.entities.Project.filter({},{sort:'name',limit:50,fields,...(input.cursor?{cursor:input.cursor}:{})});
 return {...page,items:page.items.map(p=>Object.fromEntries(fields.map(k=>[k,p[k]??null])))};
}