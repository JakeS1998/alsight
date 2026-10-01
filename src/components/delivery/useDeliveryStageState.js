import { useContext, useEffect, useState } from 'react';
import { DeliveryCollapseContext } from '@/components/delivery/DeliveryCollapseContext';
export const deliveryStageKey = title => title.replace(/^\d+[a-z]?\s*·\s*/i, '').trim().toLowerCase();
const readPreference = key => key ? JSON.parse(localStorage.getItem(key) || 'null') : null;
export default function useDeliveryStageState(title, completed) {
  const context = useContext(DeliveryCollapseContext);
  const stage = deliveryStageKey(title);
  const complete = Boolean(completed ?? context?.completion?.[stage]);
  const key = context?.userId && context?.projectId ? `als-delivery-stage:v1:${context.userId}:${context.projectId}:${stage}` : null;
  const [stored, setStored] = useState(() => ({ key, value: readPreference(key) }));
  const preference = stored.key === key ? stored.value : readPreference(key);
  const expanded = preference?.completed === complete ? preference.expanded : !complete;
  useEffect(() => {
    if (stored.key !== key) setStored({ key, value: readPreference(key) });
  }, [key, stored.key]);
  useEffect(() => {
    if (complete && preference?.completed !== true) {
      const value = { expanded: false, completed: true };
      setStored({ key, value });
      if (key) localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, complete, preference?.completed]);
  const toggle = () => {
    const value = { expanded: !expanded, completed: complete };
    setStored({ key, value });
    if (key) localStorage.setItem(key, JSON.stringify(value));
  };
  return { expanded, toggle };
}