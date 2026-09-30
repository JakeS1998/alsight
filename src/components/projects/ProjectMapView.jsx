import React from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useProjectMapData from '@/components/projects/useProjectMapData';
import ProjectBrowserMap from '@/components/projects/ProjectBrowserMap';
export default function ProjectMapView({ scopeError, retryScope, ...props }) {
  const map = useProjectMapData(props);
  const error = scopeError || map.error;
  if (error) return <div role="alert" className="rounded-xl border border-destructive/30 bg-card p-6 text-sm text-destructive">Unable to load project locations. <Button variant="outline" size="sm" onClick={() => scopeError ? retryScope() : map.retry()}>Try again</Button></div>;
  if (map.loading) return <div role="status" className="flex min-h-[400px] items-center justify-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading all matching project locations…</div>;
  return <div className="space-y-3">
    {map.geocodingError && <p role="alert" className="text-sm text-destructive">Postcode lookup is unavailable; projects with saved coordinates are still shown. <button type="button" className="underline" onClick={() => map.retryGeocoding()}>Retry postcode lookup</button></p>}
    {map.located.length ? <ProjectBrowserMap projects={map.located} showValues={!['supplier', 'project_manager'].includes(props.user?.role)} /> : <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center text-muted-foreground"><MapPin className="mb-3 h-7 w-7" /><p className="text-sm">{map.empty ? 'No projects match your filters.' : 'No project locations available for these filters.'}</p></div>}
    <p className="text-xs text-muted-foreground">All matching projects are included, not just the current page. Select a pin to open its project.{map.postcodeLocations && ' Postcode-derived locations are approximate.'}{map.hasMissing && ' Projects without coordinates or a valid UK postcode cannot be pinned.'}</p>
  </div>;
}