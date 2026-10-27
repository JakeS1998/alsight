import React from 'react';
import {Link} from 'react-router-dom';
import {ShieldAlert,ArrowLeft} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';
import {portalHomePath} from '@/components/navigation/workspaceAccess';
import {Button} from '@/components/ui/button';
export default function AccessDenied() {
  const {user}=useAuth();
  const destination=portalHomePath(user);
  return <section aria-labelledby="access-denied-title" role="alert" className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-5 py-12">
    <div className="w-full rounded-panel border border-border bg-card p-7 text-center shadow-sm sm:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary"><ShieldAlert aria-hidden="true" className="h-8 w-8"/></div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">403 · Access restricted</p>
      <h1 id="access-denied-title" className="mt-3 font-heading text-2xl font-bold text-foreground sm:text-3xl">Oops, you shouldn’t be here.</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">This page or record isn’t available to your role. If you think you should have access, please ask your administrator.</p>
      <Button asChild className="mt-7"><Link to={destination}><ArrowLeft aria-hidden="true"/>Back to my workspace</Link></Button>
    </div>
  </section>;
}