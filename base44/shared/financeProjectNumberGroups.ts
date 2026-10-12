export function mainProjectNumber(code){return String(code||'').trim().replace(/^(PROJ\d+)-R\d+$/i,'$1').toUpperCase();}
export function projectNumberPattern(codes){
 const escaped=[...new Set(codes.map(mainProjectNumber))].map(code=>code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 return `^(?:${escaped.join('|')})(?:-R\\d+)?$`;
}
export async function projectNumberPage(db,query,cursor){
 const result=await db.FinanceProjectMapping.aggregate({query,groupBy:'source_code',sort:'source_code',limit:1000});
 if(result.truncated)throw new Error('Too many project numbers to group safely. Narrow the mapping status filter.');
 const codes=[...new Set(result.rows.map(r=>mainProjectNumber(r.source_code)))].sort().filter(code=>!cursor||code>cursor),items=codes.slice(0,50),has_more=codes.length>50;
 return {items,has_more,next_cursor:has_more?items[items.length-1]:null};
}