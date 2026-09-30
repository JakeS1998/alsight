import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { formatCurrency } from '@/lib/portal';
import ProjectMapBounds from '@/components/projects/ProjectMapBounds';
export default function ProjectBrowserMap({ projects, showValues }) {
  const navigate = useNavigate();
  return <div className="relative isolate z-0 overflow-hidden rounded-xl border border-border">
    <MapContainer center={[54.5, -2]} zoom={6} className="h-[450px] w-full sm:h-[600px]" scrollWheelZoom={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_3xkp_1_d4c84e7c5c7a1eee6ccca93b" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO' />
      <ProjectMapBounds projects={projects} />
      {projects.map(project => {
        const color = project.live_project ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-1))';
        return <CircleMarker key={project.id} center={[project.latitude, project.longitude]} radius={8} pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }} eventHandlers={{ click: () => navigate(`/projects/${project.id}`) }}>
          <Tooltip direction="top" offset={[0, -8]}><div className="space-y-1 text-xs"><p className="font-semibold">{project.name}</p>{project.project_number && <p>{project.project_number}</p>}{project.client_name && <p>{project.client_name}</p>}{showValues && <p>{formatCurrency(project.estimated_value)}</p>}<p>{project.live_project ? 'Live' : 'On Hold'}{project.postcodeLocation ? ' · Approximate postcode location' : ''}</p><p>Click to open project</p></div></Tooltip>
        </CircleMarker>;
      })}
    </MapContainer>
    <div className="pointer-events-none absolute bottom-5 left-3 z-[1000] rounded-lg border border-border bg-card/95 p-3 text-xs shadow-sm backdrop-blur-sm">
      <p className="mb-2 font-semibold">Project status</p>
      <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-chart-2" />Live</p>
      <p className="mt-1.5 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-chart-1" />On Hold</p>
    </div>
  </div>;
}