import { useEffect, useMemo, useState } from 'react';
function readSnapshot(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value?.fields && value?.documents && value?.at ? value : null;
  } catch { return null; }
}
export default function useAliceChangeHistory(key, encoded, enabled) {
  const previous = useMemo(() => readSnapshot(key), [key]);
  const storedAcknowledgement = useMemo(() => readSnapshot(`${key}:acknowledged`), [key]);
  const [acknowledgement, setAcknowledgement] = useState(null);
  const acknowledged = acknowledgement?.key === key ? acknowledgement.snapshot : storedAcknowledgement;
  useEffect(() => {
    if (!encoded || !enabled) return;
    try { localStorage.setItem(key, JSON.stringify({ ...JSON.parse(encoded), at: new Date().toISOString() })); }
    catch { /* Browser storage may be unavailable. */ }
  }, [key, encoded, enabled]);
  const acknowledge = () => {
    if (!encoded || !enabled) return;
    const snapshot = { ...JSON.parse(encoded), at: new Date().toISOString() };
    localStorage.setItem(`${key}:acknowledged`, JSON.stringify(snapshot));
    setAcknowledgement({ key, snapshot });
  };
  return { previous, acknowledged, acknowledge };
}