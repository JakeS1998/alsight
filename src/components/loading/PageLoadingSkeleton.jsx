import React from 'react';
import { useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import AdaptiveWorkspaceSkeleton from '@/components/adaptive/AdaptiveWorkspaceSkeleton';
import CommercialSkeleton from '@/components/finance/CommercialSkeleton';
import PageContentSkeleton from '@/components/loading/PageContentSkeleton';
import '@/components/adaptive/adaptive-today.css';
import '@/components/adaptive/adaptive-reference.css';
import '@/components/adaptive/adaptive-flow.css';
import '@/components/adaptive/adaptive-refinements.css';
export default function PageLoadingSkeleton() {
 const {pathname}=useLocation();
 if(['/','/today','/today'].includes(pathname))return <AdaptiveWorkspaceSkeleton/>;
 if(pathname==='/commercial')return <div className="space-y-8"><Skeleton className="h-52 w-full rounded-panel"/><CommercialSkeleton/></div>;
 return <PageContentSkeleton/>;
}