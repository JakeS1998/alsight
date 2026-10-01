import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import UKLFProjectTab from '@/components/framework/UKLFProjectTab';

export default function FrameworkProjectDetail({ projectId: suppliedProjectId }) {
  const { reportId, projectId } = useParams();
  const [directProject, setDirectProject] = useState(false);
  useEffect(() => { setDirectProject(false); }, [reportId, projectId, suppliedProjectId]);
  if (directProject) return <div className="space-y-6"><Link to="/framework-reports" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-als-navy"><ArrowLeft className="h-4 w-4" /> UKLF</Link><p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Direct projects are not included in UKLF reporting.</p></div>;
  return <div className="space-y-6"><Link to="/framework-reports" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-als-navy"><ArrowLeft className="h-4 w-4" /> UKLF</Link><div><h1 className="font-heading text-2xl font-semibold text-als-navy">UKLF project</h1><p className="text-sm text-slate-500">Milestones, outcomes and project images</p></div><div role="tablist" aria-label="Project sections" className="border-b border-slate-200"><span role="tab" aria-selected="true" className="inline-block border-b-2 border-primary px-4 py-2 text-sm font-medium">UKLF</span></div><UKLFProjectTab reportId={reportId} projectId={suppliedProjectId || projectId} onDirectProject={setDirectProject} /></div>;
}