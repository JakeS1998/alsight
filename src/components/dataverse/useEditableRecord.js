import { useEffect, useState } from 'react';
export default function useEditableRecord(record) {
  const [updated, setUpdated] = useState(null);
  useEffect(() => { setUpdated(null); }, [record]);
  return [updated || record, setUpdated];
}