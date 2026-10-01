export const REQUIRED_PRE_CONSTRUCTION_APPOINTMENTS = [
  ['appointment_pm', 'Project Manager'],
  ['appointment_pd_cdm', 'Principal Designer CDM'],
  ['appointment_pd_br', 'Principal Designer BR'],
];

export function preConstructionAppointments(legalDocs) {
  const total = REQUIRED_PRE_CONSTRUCTION_APPOINTMENTS.length;
  const completed = REQUIRED_PRE_CONSTRUCTION_APPOINTMENTS.filter(([type]) =>
    legalDocs.some(doc => doc.document_type === type && doc.executed === 'yes')
  ).length;
  return { completed, total, done: completed === total };
}