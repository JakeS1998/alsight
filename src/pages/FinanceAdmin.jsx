import React from 'react';
import { Link } from 'react-router-dom';
import FinanceConnectionSetup from '@/components/finance/FinanceConnectionSetup';
import FinanceInvoiceSetup from '@/components/finance/FinanceInvoiceSetup';
import FinanceMappingAdmin from '@/components/finance/FinanceMappingAdmin';
export default function FinanceAdmin(){return <div className="space-y-6"><div className="flex flex-wrap justify-between gap-3"><div><h1 className="font-heading text-2xl font-semibold">Finance reporting setup</h1><p className="text-sm text-muted-foreground">Confirm the reporting source and manage persistent project mappings.</p></div><Link to="/finance" className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold">Open finance dashboard</Link></div><FinanceConnectionSetup/><FinanceInvoiceSetup/><FinanceMappingAdmin/></div>;}