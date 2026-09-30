import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useProjectMapPins from '@/components/projects/useProjectMapPins';
import { hasProjectCoordinates, normalisePostcode, resolveProjectPostcodes } from '@/components/projects/projectMapLocations';
export default function useProjectMapData(props) {
  const pins = useProjectMapPins(props);
  const projects = props.serverPaging ? pins.data || [] : props.portfolio;
  const postcodes = useMemo(() => [...new Set(projects.filter(project => !hasProjectCoordinates(project)).map(project => normalisePostcode(project.site_postcode)).filter(Boolean))].sort(), [projects]);
  const geocoding = useQuery({ queryKey: ['project-map-postcodes', postcodes], enabled: !!postcodes.length, staleTime: Infinity, retry: false, queryFn: ({ signal }) => resolveProjectPostcodes(postcodes, signal) });
  const located = useMemo(() => projects.map(project => hasProjectCoordinates(project) ? project : { ...project, ...geocoding.data?.[normalisePostcode(project.site_postcode)], postcodeLocation: true }).filter(hasProjectCoordinates), [projects, geocoding.data]);
  return { located, empty: projects.length === 0, hasMissing: located.length < projects.length, postcodeLocations: located.some(project => project.postcodeLocation), loading: props.serverPaging ? !props.ready || pins.isLoading || geocoding.isLoading : props.externalLoading || geocoding.isLoading, error: pins.error, geocodingError: geocoding.error, retry: pins.refetch, retryGeocoding: geocoding.refetch };
}