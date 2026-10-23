import React from "react";
import { WarrantyCard } from "@/components/documents/WarrantyCard";
import { ShieldCheck } from "lucide-react";
import ProjectEmptyState from '@/components/projects/ProjectEmptyState';
import WarrantyTrackerSummary from '@/components/projects/WarrantyTrackerSummary';

export function ProjectWarrantiesTab({ project, warranties, accountMap, hideCommentsAndLinks = false }) {
  if (warranties.length === 0) {
    return (
      <div className="space-y-4"><WarrantyTrackerSummary project={project}/><ProjectEmptyState icon={ShieldCheck} title="No warranties for this project yet." description="Ask the project's BSM to confirm which warranties are required and when they will be available." to={`/projects/${project.id}?tab=general`} action="View project team" /></div>
    );
  }

  return (
    <div className="space-y-4">
      <WarrantyTrackerSummary project={project}/>
      {warranties.map((w) => <WarrantyCard key={w.id} warranty={w} accountMap={accountMap} hideCommentsAndLinks={hideCommentsAndLinks} />)}
    </div>
  );
}