import {useEffect} from 'react';
import {useMap} from 'react-leaflet';
export default function ProjectMapFocus({project}) {
 const map=useMap();
 useEffect(()=>{if(project) map.setView([project.latitude,project.longitude],Math.max(map.getZoom(),10),{animate:false});},[map,project?.id,project?.latitude,project?.longitude]);
 return null;
}