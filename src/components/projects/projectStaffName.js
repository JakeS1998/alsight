// Historical Dataverse staff ID confirmed against the staff reporting directory.
const LEGACY_NAMES = {
  '93975ffd-453d-4c11-91f1-3030ea94c61e': 'Jake Savage',
};

export function projectStaffName(id, staffMap) {
  if (!id) return null;
  return staffMap[id] || LEGACY_NAMES[id.toLowerCase()] || null;
}