// Configuration only: illustrative geometry and reviewed references, never copied project data.
export const prototypeProjectId = '6ac7b8e21d5610a3a3c8f4ef';
export const visualiserEnabled = project => project?.id === prototypeProjectId;
export const zones = [
 {id:'pool-hall',name:'Pool hall',description:'Illustrative pool hall and tank. Shape, dimensions and position are not surveyed.',kind:'pool',x:0,y:0,w:28,d:18,h:3.2,riskIds:['6ac8f62031eaf4edc5501a7f','6ac8f62031eaf4edc5501a95'],basis:'Linked risk titles explicitly identify pool tank / finishes and pool hall glare.'},
 {id:'poolside',name:'Poolside',description:'Illustrative circulation and poolside area; not an architectural layout.',x:0,y:18,w:28,d:4,h:.3,riskIds:[]},
 {id:'changing',name:'Changing facilities',description:'Illustrative changing area. Its arrangement and scope have not been confirmed by a plan.',x:0,y:22,w:16,d:9,h:2.4,riskIds:[]},
 {id:'reception',name:'Reception',description:'Illustrative arrival space, not a confirmed representation of the existing reception.',x:16,y:22,w:12,d:9,h:2.4,riskIds:[]},
 {id:'plant',name:'Plant & filtration',description:'Illustrative technical space. Equipment placement and extent are not surveyed.',kind:'plant',x:28,y:0,w:12,d:12,h:2.6,riskIds:['6ac8f62031eaf4edc5501a7e','6ac8f62031eaf4edc5501a80','6ac8f62031eaf4edc5501a99'],basis:'Risk text explicitly concerns retained plant, pool plant access and pool filtration / balance tanks; this is a thematic association, not a confirmed room location.'},
 {id:'undercroft',name:'Undercroft',description:'Detached illustrative cutaway inset. Shown beside the pool for selection; its actual location is below the pool.',kind:'service',x:28,y:12,w:12,d:10,h:.8,riskIds:['6ac8f62031eaf4edc5501a7b'],basis:'Linked risk explicitly identifies water ingress to the pool undercroft.'},
 {id:'external',name:'External / site logistics',description:'Illustrative external works and site logistics space, with no confirmed site boundary.',kind:'external',x:28,y:22,w:12,d:9,h:.15,riskIds:['6ac8f62031eaf4edc5501a9a'],basis:'Linked risk explicitly concerns space for site offices, welfare, storage and logistics; their precise location is not recorded.'},
 {id:'roof',name:'Roof structure',description:'Detached illustrative roof inset, not its physical position above the building.',kind:'roof',x:0,y:-10,w:28,d:8,h:.5,riskIds:['6ac8f62031eaf4edc5501a7d'],basis:'Linked risk explicitly identifies roof substructure, furrings and roof deck.'}
];
export function zoneHasRisk(zone,records){return records.some(r=>zone.riskIds.includes(r.id)&&r.status==='open');}
export const statusStyles = {unknown:'fill-border/60',risk:'fill-risk-critical/20',selected:'fill-primary/25'};