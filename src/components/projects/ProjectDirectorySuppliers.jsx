import React from 'react';
import {Link} from 'react-router-dom';
import SupplierCommission from '@/components/accounts/SupplierCommission';
export default function ProjectDirectorySuppliers({accounts=[],name}){
 if(!accounts.length)return <>{name||'Not recorded'}</>;
 return <div className="space-y-2">{accounts.map(account=><div key={account.id}><Link to={`/accounts/${account.id}`} className="underline underline-offset-2 hover:text-primary">{account.name}</Link><SupplierCommission account={account} compact/></div>)}</div>;
}