import {readDataverseFinance} from './financeDataverseReads.ts';
import {mapPowerBIOrderDates} from './powerBIOrderDates.ts';
export async function readPowerBIOrderFinance(base44,state,input){
 if(input.action==='invoices')return {items:[],has_more:false,unavailable:'Client invoices are supplied through the sales-order records; separate payment receipts are not supplied by this snapshot.'};
 if(input.action==='transactions'&&!['purchase_orders','sales_orders'].includes(input.kind))return {items:[],has_more:false,total:0,unavailable:'This data is not supplied by the connected Power BI order model.'};
 const data=await readDataverseFinance(base44,state,input);
  if(['transactions','orders'].includes(input.action))data.items=await mapPowerBIOrderDates(base44,state,data.items);
  if(input.action==='dvDetail')data.record=(await mapPowerBIOrderDates(base44,state,[data.record]))[0];
 if(input.action==='summary'){data.source='Power BI semantic-model PO/SO snapshot. Original model Total values are displayed; VAT basis is not verified. PO totals and rankings include ALS Hub-linked projects only. Sales orders represent client invoices, not cash receipts.';data.powerbi=true;}
 if(input.action==='dvDetail')data.powerbi=true;
 return data;
}