import {readDataverseFinance} from './financeDataverseReads.ts';
export async function readPowerBIOrderFinance(base44,state,input){
 if(input.action==='invoices')return {items:[],has_more:false,unavailable:'The connected Power BI model supplies purchase and sales orders, not invoices or payment receipts.'};
 if(input.action==='transactions'&&!['purchase_orders','sales_orders'].includes(input.kind))return {items:[],has_more:false,total:0,unavailable:'This data is not supplied by the connected Power BI order model.'};
 const data=await readDataverseFinance(base44,state,input);
 if(input.action==='summary'){data.source='Power BI semantic-model PO/SO snapshot. Original model Total values are displayed; VAT basis is not verified. PO totals and rankings include ALSight-linked projects only. Sales orders are not invoices or payments.';data.powerbi=true;}
 if(input.action==='dvDetail')data.powerbi=true;
 return data;
}