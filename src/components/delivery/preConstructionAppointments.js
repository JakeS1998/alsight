export const REQUIRED_PRE_CONSTRUCTION_APPOINTMENTS = [
  ['appointment_pm', 'Project Manager'],
  ['appointment_pd_cdm', 'Principal Designer CDM'],
  ['appointment_pd_br', 'Principal Designer BR'],
];

export const pdBrNotApplicable = decision => decision?.applicability === 'not_applicable';
export const requiredAppointments = decision => REQUIRED_PRE_CONSTRUCTION_APPOINTMENTS.filter(([type]) => type !== 'appointment_pd_br' || !pdBrNotApplicable(decision));

export function preConstructionAppointments(legalDocs, pdBrDecision) {
  const roles = requiredAppointments(pdBrDecision);
  const total = roles.length;
  const completed = roles.filter(([type]) =>
    legalDocs.some(doc => doc.document_type === type && doc.executed === 'yes')
  ).length;
  return { completed, total, done: completed === total };
}