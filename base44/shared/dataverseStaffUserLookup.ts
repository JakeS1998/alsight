export async function lookupFlowStaffUsers(base44, query, toleratePermissionDenied = false) {
  try {
    return await base44.entities.User.filter(query);
  } catch (error) {
    const message = error?.message || error?.response?.data?.message || error?.response?.data?.error || '';
    if (!toleratePermissionDenied || !/\bpermission denied\b/i.test(String(message))) throw error;
    console.warn('Documents staff-user lookup denied; continuing with the existing Dataverse identity fallback.');
    return [];
  }
}