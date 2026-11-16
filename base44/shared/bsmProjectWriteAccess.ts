import {generalFlowMappings} from './approvalWriteBoundary.ts';
import {isGuid} from './dataverseFlowFields.ts';
export const bsmProjectTables=['projects','documents','dma','jct','warranties'];
export function roleFlowMappings(table,mappings=[],role){
 const directory=['bdm_aad_id','bsm_aad_id','director_aad_id','project_manager_id','client_rep_id'];
 const enabled=mappings.map(m=>['projects','documents','dma','jct'].includes(table)&&((role==='admin'&&m.adminWrite===true)||(role==='bsm'&&m.bsmWrite===true)) ? {...m,write:true} : table==='projects' && directory.includes(m.local) && ['admin','director','bsm','bdm'].includes(role) ? {...m,write:!(role==='bdm'&&m.local==='bsm_aad_id')} : role==='bsm'&&bsmProjectTables.includes(table)&&m.bsmWrite===true ? {...m,write:true} : m);
 return generalFlowMappings(table,enabled,role);
}
async function accessibleProject(b,id){
 if(typeof id!=='string'||!id||id.length>100){const e=new Error('A linked project is required for BSM write-back.');e.status=403;throw e;}
 const project=isGuid(id)?(await b.entities.Project.filter({dataverse_id:id},{limit:2})).items[0]:await b.entities.Project.get(id).catch(e=>[403,404].includes(e.status)?null:Promise.reject(e));
 if(!project){const e=new Error('This record is outside your accessible project portfolio.');e.status=403;throw e;}
 return project;
}
export async function assertBsmProjectWrite(b,user,table,record,input){
 if(user.role!=='bsm'||!bsmProjectTables.includes(table)||table==='projects')return;
 await accessibleProject(b,record.project_id);
 if(input.action==='save'&&Object.prototype.hasOwnProperty.call(input.values||{},'project_id'))await accessibleProject(b,input.values.project_id);
}