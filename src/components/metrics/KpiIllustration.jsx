import React from 'react';
import {Image} from '@/components/ui/image';
import '@/components/metrics/kpi-illustrations.css';
const illustrations={
 projects:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/a3815ca07_generated_image.png',
 actions:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/cd9214ca6_generated_image.png',
 completed:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/1c3c86ee4_generated_image.png',
 plans:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/02329cc65_generated_image.png',
 unassigned:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/27c24edf0_generated_image.png',
 relationships:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/297eff8ba_generated_image.png',
 finance:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/0aab2d828_generated_image.png',
 team:'https://media.base44.com/images/public/6ab62433a194f918c54c8249/24ca9d3f0_generated_image.png'
};
function subject(label){
 if(/unassigned|without.*owner/i.test(label))return 'unassigned';
 if(/await|attention|pending|overdue|risk|quiet|missing|no recorded activity/i.test(label))return 'actions';
 if(/value|fee|order|invoic|debt|credit|budget|spend|margin|income|revenue|financial/i.test(label))return 'finance';
 if(/complet|approved|outcome|riddor|on time/i.test(label))return 'completed';
 if(/client|linked|relationship|partner/i.test(label))return 'relationships';
 if(/team|people|contact|staff|capacity/i.test(label))return 'team';
 if(/diary|calendar|task|proposal|document|contract|total|all /i.test(label))return 'plans';
 return 'projects';
}
export default function KpiIllustration({label='',variant}){
 return <span className="alsight-kpi-art" aria-hidden="true"><Image src={illustrations[variant]||illustrations[subject(label)]} alt="" className="alsight-kpi-drawing" fittingType="fill" focalPointX={0.8} focalPointY={0.6} loading="lazy"/></span>;
}