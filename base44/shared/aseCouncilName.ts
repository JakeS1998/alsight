export const councilNamePattern='council|_bc|_cc|_c';
export const councilNameQuery={name:{$regex:councilNamePattern,$options:'i'}};
export function hasCouncilName(account) {
  return new RegExp(councilNamePattern,'i').test(String(account.name || ''));
}