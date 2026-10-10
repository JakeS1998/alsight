import React from 'react';
import AlsightJourney from '@/components/journey/AlsightJourney';
export default function HomeJourney({internal}) {
  return <AlsightJourney links={{relationship:internal ? '/people' : '/clients',opportunity:internal ? '/crm/opportunities' : null,fee:internal ? '/crm/opportunities' : null,project:'/projects',delivery:'/projects',handover:'/warranties'}}/>;
}