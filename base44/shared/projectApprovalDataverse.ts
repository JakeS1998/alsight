import {flowConfig,flowRequest} from './dataverseFlowApi.ts';
import {personalDataverseContext,getPersonalDataverseToken} from './dataverseUserAuth.ts';
export async function projectApprovalWriteContext(base44,user,project) {
 if(!project.dataverse_id)return null;
 if(!/^[a-f0-9-]{36}$/i.test(project.dataverse_id))throw new Error('Invalid Dataverse project identity.');
 const config=await flowConfig(base44),settings=config?.tables?.projects;
 const mappings=['approval_status','project_number'].map(local=>settings?.mappings?.find(mapping=>mapping.local===local));
 if(!settings?.entitySet || mappings.some(m=>!m || !['String','Memo'].includes(m.type) || !/^[a-zA-Z][a-zA-Z0-9_]{0,100}$/.test(m.source)))throw new Error('Confirm the project approval status and project number mappings in Dataverse setup.');
 const {environment,record}=await personalDataverseContext(base44,user);
 if(environment!==config.environment_url)throw new Error('Your Dataverse connection uses a different environment.');
 const token=await getPersonalDataverseToken(base44,user,environment,record);
 const path=`${settings.entitySet}(${project.dataverse_id})`,select=mappings.map(m=>m.source).join(',');
 const source=await flowRequest(environment,token,`${path}?$select=${select}`);
 if(!/^W\/"[0-9]+"$/.test(source['@odata.etag']))throw new Error('Dataverse did not provide a safe project version.');
 return {environment,token,path,select,source,mappings};
}
export async function writeProjectApproval(context,values) {
 if(!context)return;
 const {environment,token,path,select,source,mappings}=context;
 const payload=Object.fromEntries(mappings.filter(m=>Object.hasOwn(values,m.local)).map(m=>[m.source,values[m.local]]));
 if(Object.entries(payload).some(([key,value])=>source[key]!==value))await flowRequest(environment,token,path,{method:'PATCH',headers:{'If-Match':source['@odata.etag']},body:JSON.stringify(payload)});
 const confirmed=await flowRequest(environment,token,`${path}?$select=${select}`);
 if(Object.entries(payload).some(([key,value])=>confirmed[key]!==value))throw new Error('Dataverse has not confirmed this project decision. Retry the saved decision.');
}