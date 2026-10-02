import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Route, Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/lib/AuthContext';
import HelpArticles from '@/components/help/HelpArticles';
import HelpPathway from '@/components/help/HelpPathway';
import HelpAlice from '@/components/help/HelpAlice';
import { portalHelpArticles } from '@/components/help/portalHelpContent';
export default function Help() {
  const { user } = useAuth();
  const stakeholder = user?.role === 'framework_stakeholder';
  return <div className="space-y-6">
    <header><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ALSight guidance</p><h1 className="mt-2 font-heading text-3xl font-bold text-als-navy">Help &amp; Project Pathway</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">Practical guides to using the portal, understanding the ten-stage Project Pathway and working with ALICE.</p><Link to={stakeholder ? '/framework-reports' : '/projects'} className="mt-3 inline-block text-sm font-medium underline underline-offset-4">{stakeholder ? 'Open UKLF reports' : 'Open Projects'}</Link></header>
    <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">These guides explain the available workflows. The records, tabs and editing controls you can use depend on your role, account and project assignment.</p>
    <Tabs defaultValue="portal" className="space-y-5">
      <TabsList className="grid h-auto w-full grid-cols-1 gap-1 bg-muted p-1 sm:grid-cols-3"><TabsTrigger value="portal" className="gap-2 py-3"><BookOpen className="h-4 w-4" />Portal how-to guides</TabsTrigger><TabsTrigger value="pathway" className="gap-2 py-3"><Route className="h-4 w-4" />Project Pathway guide</TabsTrigger><TabsTrigger value="alice" className="gap-2 py-3"><Sparkles className="h-4 w-4" />ALICE guidance</TabsTrigger></TabsList>
      <TabsContent value="portal" className="space-y-4"><h2 className="font-heading text-xl font-bold">Using the portal</h2><p className="text-sm text-muted-foreground">Select a topic to see the steps and important checks.</p><HelpArticles articles={portalHelpArticles} /></TabsContent>
      <TabsContent value="pathway"><HelpPathway /></TabsContent>
      <TabsContent value="alice"><HelpAlice /></TabsContent>
    </Tabs>
  </div>;
}