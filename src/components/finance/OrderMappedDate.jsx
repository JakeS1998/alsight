import React from 'react';
import {formatDate} from '@/lib/portal';
export default function OrderMappedDate({record}){
 return <div>{record.date?formatDate(record.date):'Not recorded'}<p className="text-xs text-muted-foreground">{record.date_basis==='paid'?'Latest paid date':record.date_basis==='due'?'Earliest due date (expected)':record.transaction_matches?'No paid or due date': 'No matching transaction'}</p></div>;
}