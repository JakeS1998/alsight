import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
const links = [['/crm', 'Overview'], ['/crm/opportunities', 'Opportunities'], ['/crm/pipeline', 'Pipeline'], ['/crm/clients', 'Clients'], ['/contacts', 'Contacts'], ['/crm/activities', 'Activities'], ['/crm/tasks', 'Tasks']];
export default function CRMNav() {
  const { user } = useAuth();
  return <nav aria-label="CRM navigation" className="flex flex-wrap gap-1 border-b border-border pb-3">{links.filter(([path]) => path !== '/contacts' || user?.role === 'admin').map(([path, title]) => <NavLink key={path} end to={path} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{title}</NavLink>)}</nav>;
}