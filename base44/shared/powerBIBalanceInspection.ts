import {powerToken,powerQuery} from './financePowerBI.ts';
export async function inspectPowerBIBalances(base44,state){
 if(!state?.dataset_id)throw new Error('Activate the Power BI reporting source first.');
 const t="'crf00_transaction_tb'",token=await powerToken(base44);
 const [types,sample]=await Promise.all([
 powerQuery(token,state.dataset_id,`EVALUATE SUMMARIZE(${t},${t}[crf00_debitorcredit],"Rows",COUNTROWS(${t}),"Due",SUM(${t}[Total due]),"Entered",SUM(${t}[Total entered]),"Paid",SUM(${t}[Total paid]),"Amount",SUM(${t}[Amount]),"MissingDue",COUNTBLANK(${t}[Total due]))`),
 powerQuery(token,state.dataset_id,`EVALUATE TOPN(12,SELECTCOLUMNS(${t},"Key",[GL entry key],"Document",[Document number],"Reference",[Document reference],"Type",[crf00_debitorcredit],"Project",[Consol_Project_No],"Supplier",[Supplier name],"Customer",[Customer name],"DueDate",[Due date],"PaidDate",[Paid date],"Entered",[Total entered],"Due",[Total due],"Paid",[Total paid],"Amount",[Amount],"InvoiceAmount",[Inv_Amount],"Debit",[Debit amount],"Credit",[Credit amount]),[Key],DESC)`)
 ]);return {types,sample};
}