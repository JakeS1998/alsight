import {base44} from '@/api/base44Client';
export default async function refreshProjectReportingValue(projectId,cache) {
 const {data}=await base44.functions.invoke('refreshProjectValue',{projectId});
 if(data.error)throw new Error(data.error);
 await cache.invalidateQueries({predicate:query=>['project-value-summary','dashboard-data','overview-analytics','project-page','project-map-pins','alliance-layer'].includes(query.queryKey[0])});
}