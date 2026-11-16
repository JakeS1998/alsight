export const directoryFields = {
 'BDM': 'bdm_aad_id', 'BSM': 'bsm_aad_id', 'Director': 'director_aad_id',
 'Project Manager': 'project_manager_id', 'Client Representative': 'client_rep_id',
 'Contractor': '', 'Principal Designer (CDM)': '', 'Principal Designer (BR)': '',
 'Architect': '', 'Structural Engineer': '', 'M&E Engineer': '', 'Cost Consultant': ''
};
export const directoryProjectFields = Object.values(directoryFields).filter(Boolean);
export function canEditDirectory(role, field) {
 return ['admin','director','bsm','bdm'].includes(role) && !(role === 'bdm' && field === 'BSM');
}