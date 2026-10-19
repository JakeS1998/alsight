import React from 'react';
import {Button} from '@/components/ui/button';
import AccessDenied from '@/pages/AccessDenied';
import PageContentSkeleton from '@/components/loading/PageContentSkeleton';
export default function IEQueryState({query,children}){if(query.isPending)return <PageContentSkeleton header={false} cards={6} label="Loading I&E workspace"/>;if(query.error?.status===403)return <AccessDenied/>;if(query.error)return <div role="alert" className="rounded-panel border border-destructive/30 bg-card p-6"><p className="text-sm text-destructive">{query.error.message}</p><Button variant="outline" className="mt-3" onClick={()=>query.refetch()}>Try again</Button></div>;return children;}