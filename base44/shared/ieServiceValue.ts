export function ieServiceValue(item,finance){
 const recorded=finance===undefined&&item.service_value_source==='finance'?item.service_value:finance?.engagement_value;
 if(typeof recorded==='number'&&Number.isFinite(recorded)&&recorded>=0&&recorded<=1e12)return {service_value:recorded,service_value_source:'finance'};
 const blank={service_value:null,service_value_source:''};
 if(!item.origin?.startsWith('sharepoint:'))return blank;
 const match=String(item.description||'').match(/^Value:[ \t]*([^\r\n]*)$/m);
 if(!match)return blank;
 const text=match[1].trim().replace(/^£\s*/,'').replace(/,/g,'');
 if(!/^\d+(?:\.\d+)?$/.test(text))return blank;
 const value=Number(text);
 return Number.isFinite(value)&&value>=0&&value<=1e12?{service_value:Math.round(value*100)/100,service_value_source:'workbook'}:blank;
}