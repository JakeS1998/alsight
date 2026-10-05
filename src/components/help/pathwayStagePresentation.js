import { Target, Calculator, FileText, Users, CalendarDays, CircleCheck, Signpost, TriangleAlert, HardHat, Flag } from 'lucide-react';
export const pathwayStagePresentation = [
  { label: 'Scope', subtitle: 'Opportunity & scoping', icon: Target, highlights: ['Client need', 'Client objectives', 'Initial feasibility'] },
  { label: 'Fee', subtitle: 'Fee proposal', icon: Calculator, highlights: ['Scope of services', 'Fee proposal', 'Client acceptance'] },
  { label: 'Prepare', subtitle: 'Pre-construction', icon: FileText, highlights: ['Access Agreement', 'Key appointments', 'Procurement foundations'] },
  { label: 'Design', subtitle: 'Design & consultant team', icon: Users, highlights: ['Design team in place', 'RIBA 1–4', 'Information coordination'] },
  { label: 'Programme', subtitle: 'Programme', icon: CalendarDays, highlights: ['Programme milestones', 'Key dates', 'Dependencies'] },
  { label: 'Act', subtitle: 'Action register', icon: CircleCheck, highlights: ['Track actions', 'Assign owners', 'Monitor progress'] },
  { label: 'Decide', subtitle: 'Decision register', icon: Signpost, highlights: ['Key decisions', 'Financial adjustments', 'Programme impact'] },
  { label: 'De-risk', subtitle: 'Risk register', icon: TriangleAlert, highlights: ['Identify and assess', 'Mitigation actions', 'Owner accountability'] },
  { label: 'Build', subtitle: 'Construction', icon: HardHat, highlights: ['Contract management', 'Valuations and changes', 'Site progress'] },
  { label: 'Handover', subtitle: 'Practical completion & handover', icon: Flag, highlights: ['Practical completion', 'Handover and O&M', 'Final accounts'] },
];