import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ProjectMapBounds from '@/components/projects/ProjectMapBounds';
import ProjectWorkspacePin from '@/components/projects/workspace/ProjectWorkspacePin';
import ProjectMapFocus from '@/components/projects/workspace/ProjectMapFocus';
export default function ProjectBrowserMap({ projects, showValues, selectedId, onSelect }) {
  return <div className="relative isolate z-0 overflow-hidden rounded-xl border border-border">
    <MapContainer center={[54.5, -2]} zoom={6} className="h-[450px] w-full sm:h-[600px]" scrollWheelZoom={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_3xkp_1_d4c84e7c5c7a1eee6ccca93b" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO' />
      <ProjectMapBounds projects={projects} />
      {onSelect && <ProjectMapFocus project={projects.find(p=>p.id===selectedId)}/>}
      {projects.map(project => <ProjectWorkspacePin key={project.id} project={project} selected={project.id===selectedId} onSelect={onSelect} showValues={showValues}/>)}
    </MapContainer>
    <div className="pointer-events-none absolute bottom-5 left-3 z-[1000] rounded-lg border border-border bg-card/95 p-3 text-xs shadow-sm backdrop-blur-sm">
      <p className="mb-2 font-semibold">Project status</p>
      <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-chart-2" />Live</p>
      <p className="mt-1.5 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-chart-1" />On Hold</p>
    </div>
  </div>;
}