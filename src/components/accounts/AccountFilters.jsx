import React from 'react';
import { RELATIONSHIPS } from '@/components/accounts/accountPresentation';
import { regionName,INTERNAL_ROLES } from '@/lib/portal';
import { useAuth } from '@/lib/AuthContext';
export default function AccountFilters({ filters, onChange, options, relationship }) {
  const {user}=useAuth();
  const choices = [
    ['relationship','Relationship type',RELATIONSHIPS],
    ['organisation','Organisation type',(options.organisations || []).map(value => [value,value.replaceAll('_',' ')])],
    ['region','Region',(options.regions || []).map(value => [value,regionName(value) || value])],
    ['owner','Relationship owner',options.owners || []],
    ['ase','All Seeing Eye rating',[['unassessed','Not assessed'],...Array.from({ length: 5 },(_,i) => [String(i+1),`${i+1} / 5 (rounded)`])]],
    ['status','Status',[['active','Active'],['inactive','Inactive']]],
    ['live','Live projects',[['yes','Has live projects'],['no','No live projects']]],
    ['opportunities','Open opportunities',[['yes','Has open opportunities'],['no','No open opportunities']]],
  ];
  return <div className="account-filters"><input aria-label="Search accounts" value={filters.search || ''} onChange={event => onChange('search',event.target.value)} placeholder={`Search ${relationship === 'supplier' ? 'suppliers' : relationship === 'client' ? 'clients' : 'organisations'}, location or identifiers…`} />{choices.filter(([key])=>(key!=='relationship' || !relationship) && (key!=='ase' || INTERNAL_ROLES.includes(user?.role))).map(([key,label,values]) => <label key={key}><span>{label}</span><select value={filters[key] || ''} onChange={event => onChange(key,event.target.value)}><option value="">All</option>{values.filter(([value]) => value).map(([value,text]) => <option key={value} value={value}>{text}</option>)}</select></label>)}</div>;
}