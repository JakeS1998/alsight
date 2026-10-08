export default function projectScope(user, staffAadId) {
  const ids = [...new Set([user?.id, user?.staff_aad_id, user?.data?.staff_aad_id, user?.dataverse_systemuser_id, user?.data?.dataverse_systemuser_id, user?.delegate_of, user?.data?.delegate_of, staffAadId].filter(Boolean))];
  if (user?.role === 'bsm') return { bsm_aad_id: { $in: ids } };
  if (user?.role === 'bdm') return { $or: [{ bdm_aad_id: { $in: ids } }, { bsm_aad_id: { $in: ids } }] };
  if (user?.role === 'regional_director') return { department_id: user?.region || user?.data?.region || '__unassigned_region__' };
  return {};
}