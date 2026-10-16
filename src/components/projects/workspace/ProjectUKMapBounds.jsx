import {useEffect} from 'react';
import {useMap} from 'react-leaflet';
export default function ProjectUKMapBounds() {
  const map=useMap();
  useEffect(()=>{
    map.invalidateSize({animate:false,pan:false});
    map.fitBounds([[49.7,-8.8],[61.0,2.1]],{padding:[20,20],animate:false});
  },[map]);
  return null;
}