export function liveInsuranceQuery(base,window) {
 return {...base,$and:[
  {$or:[{status:'active'},{status:{$exists:false}}]},
  {$or:[{start_date:{$lte:window.start}},{start_date:{$exists:false}},{start_date:null},{start_date:''}]},
  {$or:[{expiry_date:{$gte:window.start}},{$and:[{$or:[{expiry_date:{$exists:false}},{expiry_date:null},{expiry_date:''}]},{renewal_date:{$gte:window.start}}]}]}
 ]};
}
export function uncoveredOverdueQuery(base,filter,coveredTypes) {
 return {...base,...filter,policy_type:{$nin:coveredTypes}};
}