let aliases=new Map();
export function setFullNameAliases(people=[]) {
 aliases=new Map();
 for(const person of people){if(!person.full_name || person.full_name==='Full name not recorded')continue;for(const alias of person.aliases || []){const key=String(alias).trim().toLowerCase(),known=aliases.get(key);aliases.set(key,known && known!==person.full_name ? 'Full name not recorded' : person.full_name);}}
}
export default function fullName(person,personId) {
 const resolved=aliases.get(String(personId || person?.id || '').toLowerCase()) || aliases.get(String(typeof person==='string' ? person : person?.full_name || '').trim().toLowerCase());
 if(resolved)return resolved;
 const value=typeof person==='string' ? person : person?.full_name;
 const name=String(value || '').trim().replace(/\s+/g,' ');
 if(name && !name.includes('@') && name.split(' ').length>1)return name;
 if(typeof person==='object' && person?.first_name && person?.last_name)return fullName(`${person.first_name} ${person.last_name}`);
 return 'Full name not recorded';
}