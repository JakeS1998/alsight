import React from 'react';
import { NavLink } from 'react-router-dom';
const links = [['/crm', 'Overview'], ['/crm/opportunities', 'Opportunities'], ['/crm/pipeline', 'Board'], ['/crm/clients', 'Clients'], ['/crm/activities', 'Activities'], ['/crm/tasks', 'Tasks']];
export default function CRMNav() {
  
  return <nav aria-label="Pipeline navigation" className="pipeline-navigation flex flex-wrap gap-2">{links.map(([path, title]) => <NavLink key={path} end to={path} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>{title}</NavLink>)}</nav>;
}