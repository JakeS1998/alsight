import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChartNoAxesCombined, ClipboardList } from 'lucide-react';
import SlidingTabHighlight from '@/components/navigation/SlidingTabHighlight';

const items = [
  { label: 'Dashboard', path: '/commercial', icon: ChartNoAxesCombined },
  { label: 'PO Tool', path: '/commercial/po-tool', icon: ClipboardList },
];
export default function CommercialNavigation() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return <nav aria-label="Commercial views" className="commercial-tabs sliding-tab-list">
    <SlidingTabHighlight />
    {items.map(({ label, path, icon: Icon }) => <button key={path} type="button" aria-pressed={pathname === path} onClick={() => navigate(path)}>
      <span className="sliding-tab-label"><Icon size={16} aria-hidden="true" />{label}</span>
    </button>)}
  </nav>;
}