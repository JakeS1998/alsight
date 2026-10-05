import { XMLParser } from 'npm:fast-xml-parser@4.5.3';
const local=name=>String(name).split(':').at(-1);
const text=node=>typeof node==='object' && node ? Object.entries(node).filter(([key])=>!key.startsWith('@_')).map(([,value])=>Array.isArray(value) ? value.map(text).join('') : text(value)).join('') : String(node ?? '');
function walk(node,visit) { if(!node || typeof node!=='object') return; for(const [key,value] of Object.entries(node)) for(const child of Array.isArray(value) ? value : [value]) {visit(key,child);walk(child,visit);} }
const child=(node,name)=>Object.entries(node || {}).find(([key])=>local(key)===name)?.[1];
const concepts={revenue:['TurnoverRevenue','Revenue','Turnover'],profit:['ProfitLoss','ProfitLossForPeriod'],assets:['Assets','TotalAssets'],current_assets:['CurrentAssets'],fixed_assets:['FixedAssets','NoncurrentAssets'],current_liabilities:['CurrentLiabilities','CreditorsDueWithinOneYear'],net_assets:['NetAssetsLiabilities','Equity'],cash:['CashBankInHand','CashAndCashEquivalents'],borrowings:['Borrowings','TotalBorrowings'],employees:['AverageNumberEmployeesDuringPeriod','AverageNumberOfEmployees']};
export function parseFiledAccounts(xml,number) {
  if(xml.length>750000 || /<!ENTITY/i.test(xml)) throw new Error('Accounts XML exceeds the parsing limit or contains unsupported entity declarations.');
  const tree=new XMLParser({ignoreAttributes:false,parseTagValue:false,parseAttributeValue:false,processEntities:false,trimValues:true}).parse(xml.replace(/<!DOCTYPE[^>]*>/gi,''));
  const contexts=new Map(),units=new Map(),values=[];
  walk(tree,(tag,node)=>{
    if(local(tag)==='context') {
      const entity=child(node,'entity'),identifier=text(child(entity,'identifier')).trim().toUpperCase(),period=child(node,'period');
      const validIdentifier=/^(?:\d{1,8}|[A-Z]{2}\d{1,6})$/.test(identifier) && (identifier.match(/^\d+$/) ? identifier.padStart(8,'0') : identifier.slice(0,2)+identifier.slice(2).padStart(6,'0'))===number;
      if(!validIdentifier || child(entity,'segment') || child(node,'scenario')) return;
      const end=text(child(period,'instant') || child(period,'endDate')),start=text(child(period,'startDate'));
      if(!/^\d{4}-\d{2}-\d{2}$/.test(end) || Date.parse(end)>Date.now()) return;
      const days=start ? (Date.parse(end)-Date.parse(start))/86400000+1 : 0;
      contexts.set(node['@_id'],{end,start,annual:days>=365 && days<=366});
    }
    if(local(tag)==='unit' && node?.['@_id']) units.set(node['@_id'],text(child(node,'measure')).trim());
  });
  walk(tree,(tag,node)=>{
    if(!node || typeof node!=='object' || !node['@_contextRef'] || ['true','1'].includes(node['@_xsi:nil'] || node['@_nil'])) return;
    const context=contexts.get(node['@_contextRef']),name=local(node['@_name'] || tag),metric=Object.keys(concepts).find(key=>concepts[key].includes(name));
    if(!context || !metric || (metric!=='employees' && !/(?:^|:)GBP$/.test(units.get(node['@_unitRef']) || ''))) return;
    if(['revenue','profit','employees'].includes(metric) && !context.start) return;
    if(!['revenue','profit','employees'].includes(metric) && context.start) return;
    const format=local(node['@_format'] || ''),scale=Number(node['@_scale'] || 0);
    if(!Number.isInteger(scale) || Math.abs(scale)>12 || (format && !['numdotdecimal','numcommadecimal','numdash','zerodash'].includes(format))) return;
    let raw=text(node).replace(/&#(?:160|xA0);|&nbsp;/gi,'').replace(/\s/g,'');
    if(['numdash','zerodash'].includes(format) && /^[-–—]$/.test(raw)) raw='0';
    else if(format==='numcommadecimal') raw=raw.replace(/\./g,'').replace(',','.');
    else if(format==='numdotdecimal') raw=raw.replace(/,/g,'');
    if(!/^-?\d+(?:\.\d+)?$/.test(raw)) return;
    const value=Number(raw)*10**scale*(node['@_sign']==='-' ? -1 : 1);
    if(Number.isFinite(value)) values.push({metric,concept:node['@_name'] || tag,value,...context});
  });
  const periods=[...new Set(values.map(row=>row.end))].sort().reverse().slice(0,3);
  return periods.map(end=>({end,metrics:Object.fromEntries(Object.keys(concepts).flatMap(metric=>{const matches=values.filter(row=>row.end===end && row.metric===metric);return matches.length && new Set(matches.map(row=>row.value)).size===1 ? [[metric,matches[0]]] : [];}))})).filter(period=>Object.keys(period.metrics).length);
}