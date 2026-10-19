import { useEffect, useRef } from 'react';

// Reset pagination for actual filter edits, not when a remembered list mounts.
export default function useListFilterReset(reset, dependencies) {
  const signature = JSON.stringify(dependencies), previous = useRef(signature);
  useEffect(() => {
    if (previous.current === signature) return;
    previous.current = signature;
    reset();
  }, [signature]);
}