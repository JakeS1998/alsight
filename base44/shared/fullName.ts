export const missingFullName='Full name not recorded';
export function fullName(value) {
 const name=String(value || '').trim().replace(/\s+/g,' ');
 return name && !name.includes('@') && name.split(' ').length>1 ? name : missingFullName;
}
export function contactFullName(contact) {
 const recorded=fullName(contact.full_name);
 return recorded!==missingFullName ? recorded : contact.first_name && contact.last_name ? fullName(`${contact.first_name} ${contact.last_name}`) : missingFullName;
}