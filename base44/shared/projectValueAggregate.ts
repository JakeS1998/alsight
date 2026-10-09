// Keep the existing response shape while calculating the full reporting value in one database aggregate.
export async function projectValueAggregate(entities,options) {
 const sums=Array.isArray(options.sum) ? options.sum : options.sum ? [options.sum] : [];
 if(!sums.includes('estimated_value'))return entities.Project.aggregate(options);
 const result=await entities.Project.aggregate({...options,sum:sums.map(field=>field==='estimated_value' ? 'full_value' : field),...(options.sort ? {sort:options.sort.replace('sum_estimated_value','sum_full_value')} : {})});
 return {...result,rows:result.rows.map(({sum_full_value,...row})=>({...row,sum_estimated_value:sum_full_value || 0}))};
}
export const valuedProjectQuery={full_value:{$gt:0}};