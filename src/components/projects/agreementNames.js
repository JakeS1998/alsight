import frameworkVersion from '@/components/projects/frameworkVersion';

export default function agreementNames(projectNumber) {
  const fw4 = frameworkVersion(projectNumber) === 'FW4';
  return {
    access: fw4 ? 'Framework Engagement Agreement' : 'Access Agreement',
    accessShort: fw4 ? 'FEA' : 'AA',
    development: fw4 ? 'Development Partner Agreement' : 'Development Management Agreement',
    developmentShort: fw4 ? 'DPA' : 'DMA',
  };
}

export function agreementFeeLabel(version, route) {
  if (route === 'dma') return version === 'FW4' ? 'Development Partner Agreement (DPA)' : 'DMA';
  return route === 'equipment_only' ? 'Equipment-only Agreement' : 'Single-task Agreement';
}