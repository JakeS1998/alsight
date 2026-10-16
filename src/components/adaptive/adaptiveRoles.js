const profiles={
 director:['Portfolio perspective','Significant exceptions, commercial exposure and decisions',['projects','approvals','commercial','activity','documents'],['approvals','projects','commercial']],
 admin:['Portfolio perspective','Significant exceptions and decisions within your access',['projects','approvals','commercial','activity','documents'],['approvals','projects','commercial']],
 regional_director:['Regional leadership perspective','Regional exceptions, approvals and decisions',['projects','approvals','commercial','activity','documents'],['approvals','projects','commercial']],
 finance:['Commercial perspective','Fees, proposals and financial follow-through',['commercial','approvals','projects','activity','documents'],['commercial','approvals']],
 bsm:['Business support perspective','Documents, compliance and project readiness',['documents','approvals','projects','activity','commercial'],['documents','compliance']],
 bdm:['Business development perspective','Clients, opportunities and upcoming decisions',['opportunities','projects','commercial','activity','documents'],['commercial','projects']],
 sam:['Insights & engagement perspective','Assigned engagements, relationships and project context',['projects','activity','documents','approvals'],['projects','approvals']],
 sam_director:['Insights & engagement leadership','Engagement exceptions, relationships and decisions',['projects','approvals','activity','documents'],['approvals','projects']]
};
export default function adaptiveRoles(roles) {
 const recognised=roles.map(role=>profiles[role]).filter(Boolean),fallback=['Your working perspective','Your assigned work and accessible records',['projects','activity','documents','approvals'],['projects']];
 const selected=recognised.length?recognised:[fallback],lead=selected[0];
 return {label:selected.length>1?'Combined responsibilities':lead[0],description:selected.map(p=>p[1]).join(' · '),widgets:[...new Set(selected.flatMap(p=>p[2]))],categories:[...new Set(selected.flatMap(p=>p[3]))]};
}