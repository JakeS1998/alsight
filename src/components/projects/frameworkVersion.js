export default function frameworkVersion(projectNumber) {
  const match = /^(?:PROJ\s*)?(\d+)$/i.exec(String(projectNumber || '').trim());
  return match ? (Number(match[1]) < 1000 ? 'FW3' : 'FW4') : null;
}