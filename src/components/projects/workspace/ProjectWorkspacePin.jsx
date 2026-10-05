import React,{useEffect,useRef} from 'react';
import {CircleMarker,Tooltip,Popup} from 'react-leaflet';
import {Link,useNavigate} from 'react-router-dom';
import {formatCurrency} from '@/lib/portal';
export default function ProjectWorkspacePin({project,selected,onSelect,showValues}) {
 const ref=useRef(null),navigate=useNavigate();
 useEffect(()=>{if(selected && onSelect)ref.current?.openPopup();},[selected,onSelect]);
 const color=selected ? 'hsl(var(--primary))' : project.live_project ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-1))';
 const summary=<div className="space-y-1 text-xs"><p className="font-semibold">{project.name}</p><p>{project.client_name}</p><p>{project.site_postcode}</p><p>{project.live_project ? 'Live' : 'On hold'}{project.postcodeLocation ? ' · Approximate postcode location' : ''}</p>{showValues && <p>{formatCurrency(project.estimated_value)}</p>}</div>;
 return <CircleMarker ref={ref} center={[project.latitude,project.longitude]} radius={selected ? 11 : 8} pathOptions={{color,fillColor:color,fillOpacity:.85,weight:selected ? 4 : 2}} eventHandlers={{click:()=>onSelect ? onSelect(project) : navigate(`/projects/${project.id}`)}}><Tooltip direction="top" offset={[0,-8]}>{summary}</Tooltip>{onSelect && <Popup>{summary}<Link to={`/projects/${project.id}`} className="mt-2 inline-block underline">Open full project</Link></Popup>}</CircleMarker>;
}