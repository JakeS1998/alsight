import React from 'react';
import FrameworkMapFocus from '@/components/framework/FrameworkMapFocus';
import {MapContainer,TileLayer,CircleMarker,Popup,useMap} from 'react-leaflet';
import {Link} from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
export default function FrameworkWorkspaceMap({rows,selected,onLink,canLink}) {
 const points=rows.filter(row=>row.location);
 if(!points.length)return <p className="p-10 text-center text-sm text-muted-foreground">No verified locations are available on this results page. Only accessible linked ALSight projects with stored coordinates are mapped.</p>;
 return <div><p className="px-5 py-3 text-xs text-muted-foreground">{points.length} verified locations on this results page. Unlinked records and inaccessible project locations are not inferred.</p><MapContainer zoomAnimation={false} center={[54,-2]} zoom={6} className="z-0 h-[440px] w-full"><TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_3xkp_1_d4c84e7c5c7a1eee6ccca93b" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO'/><FrameworkMapFocus points={points} selected={selected}/>{points.map(row=><CircleMarker key={row.id} center={[row.location.latitude,row.location.longitude]} radius={row.id===selected ? 11 : 7} pathOptions={{color:'hsl(var(--als-navy))',fillColor:'hsl(var(--primary))',fillOpacity:0.9}}><Popup><strong>{row.site || row.framework_ref}</strong><p>{row.client}</p><p>{row.project_number || row.framework_ref}</p><Link to={`/framework-reports/${row.id}`}>Open Framework Record</Link>{row.project_id && <p><Link to={`/projects/${row.project_id}`}>Open in ALSight</Link></p>}</Popup></CircleMarker>)}</MapContainer></div>;
}