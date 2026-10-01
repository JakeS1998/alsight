import React, { createContext } from 'react';
import { useAuth } from '@/lib/AuthContext';
export const DeliveryCollapseContext = createContext(null);
export default function DeliveryCollapseProvider({ children, projectId, completion = {} }) {
  const { user } = useAuth();
  return <DeliveryCollapseContext.Provider value={{ projectId, userId: user?.id, completion }}>{children}</DeliveryCollapseContext.Provider>;
}