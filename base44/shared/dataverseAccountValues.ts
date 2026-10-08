export function accountFlowValues(table, values, existing = null) {
  if (table !== 'accounts' || !values) return { value: values, error: '' };
  const valid = value => ['client', 'supplier'].includes(value);
  if (valid(values.account_type)) return { value: values, error: '' };
  if ((values.account_type == null || values.account_type === '') && valid(existing?.account_type)) {
    return { value: { ...values, account_type: existing.account_type }, error: '' };
  }
  return { value: values, error: 'Account type is missing or invalid. Map the Dataverse account type to client or supplier and complete it on the source record, or review the link to an existing classified ALSight account.' };
}