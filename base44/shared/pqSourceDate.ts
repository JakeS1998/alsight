export function pqSourceDate(quote,suggested){
 const dates=[];
 for(const match of quote.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g))dates.push(match[0]);
 for(const match of quote.matchAll(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4}|\d{2})\b/g)){
  const year=match[3].length===2?'20'+match[3]:match[3];dates.push(`${year}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`);
 }
 const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
 for(const match of quote.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi)){
  dates.push(`${match[3]}-${String(months.indexOf(match[2].toLowerCase())+1).padStart(2,'0')}-${match[1].padStart(2,'0')}`);
 }
 const valid=[...new Set(dates)].filter(date=>Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date);
 if(valid.length===1)return valid[0];
 return valid.includes(suggested)?suggested:'';
}