import React from 'react';
import { Link } from 'react-router-dom';
export default function DashboardPanel({ title, subtitle, link, linkLabel = 'View all', onViewAll, children, className = '' }) {
  return <section className={`dashboard-panel ${className}`}><header className="mb-3 flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-heading text-sm font-extrabold text-als-navy">{title}</h2>{subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}</div>{onViewAll ? <button onClick={onViewAll} className="text-xs font-medium text-chart-2 hover:underline">{linkLabel} →</button> : link && <Link to={link} className="text-xs font-medium text-chart-2 hover:underline">{linkLabel} →</Link>}</header>{children}</section>;
}