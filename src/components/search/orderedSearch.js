export const escapePattern = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const orderedPattern = value => Array.from(String(value).trim().slice(0, 80)).filter(c => !/\s/.test(c)).map(escapePattern).join('.*?');
export function matchPositions(value, term) {
 const text=Array.from(String(value ?? '')), query=Array.from(String(term || '').trim().toLowerCase());
 if(!query.length)return [];
 const lower=text.map(c=>c.toLowerCase()), start=lower.join('').indexOf(query.join(''));
 if(start>=0)return Array.from({length:query.length},(_,i)=>start+i);
 const letters=query.filter(c=>!/\s/.test(c)), positions=[];let next=0;
 for(let i=0;i<lower.length && next<letters.length;i++)if(lower[i]===letters[next]){positions.push(i);next++;}
 return next===letters.length ? positions : [];
}
export function textContent(node) {
 if(typeof node==='string' || typeof node==='number')return String(node);
 if(Array.isArray(node))return node.map(textContent).join(' ');
 return node?.props?.children ? textContent(node.props.children) : '';
}