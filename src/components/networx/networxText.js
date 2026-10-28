export default function networxText(value) {
  const entities = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',lsquo:'‘',rsquo:'’',ldquo:'“',rdquo:'”',bull:'•',pound:'£',euro:'€',hellip:'…'};
  return String(value || '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'').replace(/<br\s*\/?\s*>|<\/(?:p|div|li|tr|h[1-6])\s*>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi,(match,key)=>{
    if (key[0] !== '#') return entities[key.toLowerCase()] ?? match;
    const code = key[1].toLowerCase()==='x' ? parseInt(key.slice(2),16) : parseInt(key.slice(1),10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
  }).replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}