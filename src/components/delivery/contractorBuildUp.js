// Contractor fee build-up: surveys (RIBA 1-4) + OHP, and RIBA 5-7 authorised activities + OHP.
const SURVEY_STAGES = ['riba_1', 'riba_2', 'riba_3', 'riba_4'];

export const isContractorMember = (m) => String(m?.role || '').trim().toLowerCase() === 'contractor';

export function contractorMembers(deliveryTeam) {
  return (deliveryTeam || []).filter(isContractorMember);
}

export function contractorBuildUp(deliveryTeam, ohpSurveysPct, ohpRiba57Pct) {
  const contractors = contractorMembers(deliveryTeam);
  const surveysBase = contractors.reduce(
    (sum, m) => SURVEY_STAGES.reduce((s, st) => s + (Number(m.fees?.[st]) || 0), 0),
    0,
  );
  const riba57Base = contractors.reduce((sum, m) => sum + (Number(m.fees?.riba_5_7) || 0), 0);
  const ohpS = Number(ohpSurveysPct) || 0;
  const ohpR = Number(ohpRiba57Pct) || 0;
  const surveysOhp = Math.round(surveysBase * ohpS) / 100;
  const riba57Ohp = Math.round(riba57Base * ohpR) / 100;
  const surveysTotal = surveysBase + surveysOhp;
  const riba57Total = riba57Base + riba57Ohp;
  return {
    hasContractor: contractors.length > 0,
    surveysBase,
    surveysOhp,
    surveysTotal,
    riba57Base,
    riba57Ohp,
    riba57Total,
    rawTotal: surveysBase + riba57Base,
    ohpTotal: surveysOhp + riba57Ohp,
    total: surveysTotal + riba57Total,
    ohpSurveysPct: ohpS,
    ohpRiba57Pct: ohpR,
  };
}