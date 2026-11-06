import React from 'react';
export default function FinanceBalanceNotice({data,kind}){
 const total=data.totals.find(t=>t.kind===kind);
 if(!total)return null;
 if(total.mapped===false)return <p className="mt-3 text-sm text-muted-foreground">Link this project to its finance codes to confirm its balance.</p>;
 if(total.excluded)return <p role="status" className="mt-3 text-sm text-muted-foreground">Some invoices span multiple projects and cannot be fully attributed here. The full balance is not confirmed; invoices and history below show wholly attributable records only.</p>;
 if(total.missing)return <p role="status" className="mt-3 text-sm text-muted-foreground">Some invoice amounts cannot be confirmed. This is not evidence that nothing is outstanding.</p>;
 if(total.amount===0&&total.outstanding_invoices===0)return <p role="status" className="mt-3 text-sm text-success">Nothing is outstanding{kind==='creditors'?' to suppliers':' from customers'}. {total.recorded?'Recorded invoices are settled and can be viewed below.':'No outstanding invoices are recorded in the source.'}</p>;
 return null;
}