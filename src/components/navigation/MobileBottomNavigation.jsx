import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import MobileNavigationMenu from '@/components/navigation/MobileNavigationMenu';
import '@/components/navigation/portal-mobile-navigation.css';

export default function MobileBottomNavigation({ user, items, open, onOpenChange, onSignOut, children }) {
  const { pathname } = useLocation();
  useEffect(() => { onOpenChange(false); }, [pathname, user?.role, onOpenChange]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const close = () => { if (desktop.matches) onOpenChange(false); };
    desktop.addEventListener('change', close);
    return () => desktop.removeEventListener('change', close);
  }, [onOpenChange]);
  const active = item => item.path === '/today'
    ? ['/', '/today', '/today-legacy'].includes(pathname)
    : pathname === item.path || pathname.startsWith(`${item.path}/`);
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <nav aria-label="Mobile navigation" className="portal-mobile-navigation lg:hidden">
      {items.map(({ icon: Icon, ...item }) => <Link key={item.path} to={item.path} aria-label={item.label} title={item.label} aria-current={active(item) ? 'page' : undefined}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </Link>)}
      <SheetTrigger asChild><button type="button" aria-label="Open more navigation" title="Menu"><Menu className="h-6 w-6" aria-hidden="true" /></button></SheetTrigger>
    </nav>
    <MobileNavigationMenu user={user} onSignOut={onSignOut} onClose={() => onOpenChange(false)}>{children}</MobileNavigationMenu>
  </Sheet>;
}