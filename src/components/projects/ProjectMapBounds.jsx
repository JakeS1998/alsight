import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
export default function ProjectMapBounds({ projects }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (projects.length) map.fitBounds(projects.map(project => [project.latitude, project.longitude]), { padding: [35, 35], maxZoom: 12 });
  }, [map, projects]);
  return null;
}