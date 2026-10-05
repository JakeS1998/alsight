import {commercialInsight} from './aseCommercialInsight.ts';
export async function commercialSnapshot(base44,account,at) {
  try {return await commercialInsight(base44,account,{at,snapshot:true});}
  catch(error) {return {version:'commercial-concentration-v1',status:'unavailable',checked_at:at,reason:'Commercial context could not be verified: '+String(error.message).slice(0,200),percentage:null,method:'No concentration conclusion was inferred. This non-scoring insight does not affect ASE publication or ratings.'};}
}