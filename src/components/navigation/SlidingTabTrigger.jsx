import React from 'react';
import { TabsTrigger } from '@/components/ui/tabs';

const SlidingTabTrigger = React.forwardRef(({ children, ...props }, ref) => (
  <TabsTrigger ref={ref} {...props}><span className="sliding-tab-label">{children}</span></TabsTrigger>
));
SlidingTabTrigger.displayName = 'SlidingTabTrigger';
export default SlidingTabTrigger;