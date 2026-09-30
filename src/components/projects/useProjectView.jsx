import { useEffect, useState } from 'react';
function initialChoice(key, options, fallback) {
  const stored = sessionStorage.getItem(key);
  return options.includes(stored) ? stored : fallback;
}
export default function useProjectView() {
  const [view, setView] = useState(() => initialChoice('als-projects-view', ['cards', 'list', 'map'], 'cards'));
  const [density, setDensity] = useState(() => initialChoice('als-projects-density', ['compact', 'comfortable'], 'compact'));
  useEffect(() => { sessionStorage.setItem('als-projects-view', view); sessionStorage.setItem('als-projects-density', density); }, [view, density]);
  return { view, setView, density, setDensity };
}