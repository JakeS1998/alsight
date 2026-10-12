import { liveProjectSummary } from './liveProjectSummary.ts';
export async function commercialPipelineSummary(base44) {
 return {...await liveProjectSummary(base44.entities),read_at:new Date().toISOString()};
}