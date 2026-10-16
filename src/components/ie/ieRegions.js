import {REGION_OPTIONS as projectRegions,regionName as projectRegionName} from '@/lib/portal';
// Company-wide work is not assigned to a geographical project region.
export const COMPANY_REGION_ID='alliance_leisure';
export const REGION_OPTIONS=[...projectRegions,{value:COMPANY_REGION_ID,label:'Alliance Leisure'}];
export function regionName(id){return id===COMPANY_REGION_ID?'Alliance Leisure':projectRegionName(id);}