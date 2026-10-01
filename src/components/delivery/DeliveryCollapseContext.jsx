import React, { createContext } from 'react';
export const DeliveryCollapseContext = createContext(false);
export default function DeliveryCollapseProvider({ children }) {
  return <DeliveryCollapseContext.Provider value={true}>{children}</DeliveryCollapseContext.Provider>;
}