// Contractor fee build-up: surveys (RIBA 1-4) + OHP, and RIBA 5-7 authorised activities + OHP.
const SURVEY_STAGES = ['riba_1', 'riba_2', 'riba_3', 'riba_4'];

export const isContractorMember = (m) => String(m?.role || '').trim().toLowerCase() === 'contractor';

export function contractorMembers(deliveryTeam) {
  return (deliveryTeam || []).filter(isContractorMember);
}

export function contractorBuildUp(deliveryTeam, ohpSurveysPct, ohpRiba57Pct, ohpSurveysType = 'percentage', ohpSurveysFixed = 0) {
  const contractors = contractorMembers(deliveryTeam);
  let surveysBase = 0;
  let riba57Base = 0;
  contractors.forEach((m) => {
    if (Array.isArray(m.contractor_fees) && m.contractor_fees.length) {
      m.contractor_fees.forEach((f) => {
        const amt = Number(f.amount) || 0;
        if (f.type === 'authorised_activity' || f.stage === 'riba_5_7') riba57Base += amt;
        else surveysBase += amt;
      });
    } else {
      surveysBase += SURVEY_STAGES.reduce((s, st) => s + (Number(m.fees?.[st]) || 0), 0);
      riba57Base += Number(m.fees?.riba_5_7) || 0;
    }
  });
  const ohpS = Number(ohpSurveysPct) || 0;
  const ohpR = Number(ohpRiba57Pct) || 0;
  const surveysOhp = ohpSurveysType === 'fixed' ? Math.round((Number(ohpSurveysFixed) || 0) * 100) / 100 : Math.round(surveysBase * ohpS) / 100;
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
    ohpSurveysType,
    ohpSurveysPct: ohpS,
    ohpRiba57Pct: ohpR,
  };
}