export function compassNumber(value,unit,compact=false) {
  if(!Number.isFinite(value))return 'Not available';
  if(unit==='GBP')return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:compact?1:2,...(compact?{notation:'compact'}:{})}).format(value);
  const number=new Intl.NumberFormat('en-GB',{maximumFractionDigits:unit==='count'?0:2,...(compact?{notation:'compact'}:{})}).format(value);
  return `${number}${unit==='percent'?'%':unit==='points'?' pp':unit==='ratio'?'×':unit==='score'?'/5':''}`;
}
export function compassDate(value) {
  const date=new Date(value);
  return Number.isFinite(date.getTime())?date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'Date not recorded';
}