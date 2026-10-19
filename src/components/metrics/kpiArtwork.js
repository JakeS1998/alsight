export const kpiArtwork = {
 projects:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/a3815ca07_generated_image.png',
 actions:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/cd9214ca6_generated_image.png',
 completed:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/1c3c86ee4_generated_image.png',
 plans:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/02329cc65_generated_image.png',
 unassigned:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/27c24edf0_generated_image.png',
 relationships:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/297eff8ba_generated_image.png',
 finance:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/0aab2d828_generated_image.png',
 team:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/24ca9d3f0_generated_image.png',
 buildingFinance:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/6e872df22_generated_image.png',
 contracts:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/1a2e5cf7f_generated_image.png',
 calculations:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/637fbedb9_generated_image.png',
 diary:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/dc8f278f8_generated_image.png',
 safety:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/54eee3c72_generated_image.png',
 engagement:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/4e272476f_generated_image.png',
 reports:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/2443c8f3a_generated_image.png'
};
export function artworkSubject(label){
 const rules=[
  [/unassigned|without.*owner/i,'unassigned'],
  [/await|attention|pending|overdue|quiet|missing|no recorded activity/i,'actions'],
  [/riddor|safety|risk/i,'safety'],
  [/diary|calendar|on time/i,'diary'],
  [/call.?off|contract|agreement|all approvals/i,'contracts'],
  [/fee|budget|calculation/i,'calculations'],
  [/project value|pipeline value/i,'buildingFinance'],
  [/value|order|invoic|debt|credit|spend|margin|income|revenue|financial/i,'finance'],
  [/complet|approved/i,'completed'],
  [/outcome|report|total engagements/i,'reports'],
  [/client|linked|relationship|partner/i,'relationships'],
  [/team|people|contact|staff|capacity|total I&E/i,'team'],
  [/engagement|active I&E/i,'engagement'],
  [/task|proposal|document|total|all |live projects|pipeline projects/i,'plans']
 ];
 return rules.find(([pattern])=>pattern.test(label))?.[1] || 'projects';
}
export function artworkCandidates(preferred){
 const related={finance:['calculations','buildingFinance','contracts','reports'],projects:['plans','buildingFinance','engagement','reports'],actions:['plans','contracts','unassigned','safety'],engagement:['relationships','team','projects','reports'],relationships:['engagement','team','projects'],team:['relationships','engagement','reports'],plans:['contracts','reports','projects'],completed:['reports','contracts','safety'],contracts:['plans','reports','completed'],calculations:['finance','buildingFinance','reports'],buildingFinance:['finance','calculations','projects'],diary:['plans','completed','reports'],safety:['completed','actions','reports'],reports:['completed','plans','contracts']};
 return [...new Set([preferred,...(related[preferred] || []),...Object.keys(kpiArtwork)])];
}