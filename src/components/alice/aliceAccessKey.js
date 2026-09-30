export default function aliceAccessKey(user) {
  const data = user?.data || {};
  return JSON.stringify([
    'alice-rls-v2', user?.id, user?.role, user?.updated_date,
    user?.account_id ?? data.account_id,
    user?.staff_aad_id ?? data.staff_aad_id,
    user?.region ?? data.region,
    user?.delegate_of ?? data.delegate_of,
    user?.delegate_region ?? data.delegate_region,
    user?.company_number ?? data.company_number,
  ]);
}