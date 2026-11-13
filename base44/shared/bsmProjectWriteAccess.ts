import {generalFlowMappings} from './approvalWriteBoundary.ts';
import {isGuid} from './dataverseFlowFields.ts';
export const bsmProjectTables=['projects','documents','dma','jct','warranties'];
export function roleFlowMappings(table,mappings=[],role){
 return generalFlowMappings(table,role==='bsm'&&bsmProjectTables.includes(table)?mappings.map(m=>m.bsmWrite===true?{...m,write:true}:m):mappings);
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