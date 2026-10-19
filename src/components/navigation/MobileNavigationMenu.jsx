import React from 'react';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import UserMenu from '@/components/UserMenu';

export default function MobileNavigationMenu({ children, user, onSignOut, onClose }) {
  return <SheetContent side="bottom" className="portal-mobile-menu max-h-[75dvh] overflow-y-auto rounded-t-panel border-sidebar-border bg-als-navy text-sidebar-foreground lg:hidden">
    <SheetHeader className="mb-4 text-left">
      <SheetTitle className="text-sidebar-foreground">Menu</SheetTitle>
      <SheetDescription className="sr-only">More navigation and account options</SheetDescription>
    </SheetHeader>
    <nav aria-label="More navigation" className="grid gap-1 sm:grid-cols-2">{children}</nav>
    <div className="mt-4 border-t border-sidebar-border pt-4"><UserMenu user={user} mobile onSignOut={onSignOut} onNavigate={onClose} /></div>
  </SheetContent>;
}