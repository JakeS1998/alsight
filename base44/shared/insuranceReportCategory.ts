export const insuranceReportCategoryOrder = ['Principal Contractors', 'Architects', 'PM, PD, QS', 'Other Suppliers'];
export function insuranceReportCategory(account) {
 const titles = (account.categories || []).map(value => String(value).toLowerCase());
 if (titles.some(title => /\bprincipal contractors?\b/.test(title))) return 'Principal Contractors';
 if ([String(account.name || '').toLowerCase(), ...titles].some(title => title.includes('architect'))) return 'Architects';
 if (titles.some(title => /\b(project manag(?:er|ers|ement)|principal designers?|quantity survey(?:or|ors|ing)|pm|pd|qs)\b/.test(title))) return 'PM, PD, QS';
 return 'Other Suppliers';
}