import {useEffect} from 'react';
import {useMap} from 'react-leaflet';
export default function FrameworkMapFocus({points,selected}) {
 const map=useMap();
 useEffect(()=>{const row=points.find(p=>p.id===selected);if(row)map.setView([row.location.latitude,row.location.longitude],12);else if(points.length)map.fitBounds(points.map(p=>[p.location.latitude,p.location.longitude]),{padding:[40,40],maxZoom:12});},[map,points,selected]);
 return null;
}