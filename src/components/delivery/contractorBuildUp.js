import { CONTRACTOR_STAGES, CONTRACTOR_LABELS, contractorStageBases, calculateStageOhp } from '@/components/delivery/contractorFeeRows';
import normalizeContractorOhp from '@/components/delivery/normalizeContractorOhp';

export const isContractorMember = (m) => String(m?.role || '').trim().toLowerCase() === 'contractor';

export function contractorMembers(deliveryTeam) {
  return (deliveryTeam || []).filter(isContractorMember);
}

export function contractorBuildUp(deliveryTeam, ohpSurveysPct, ohpRiba57Pct, ohpSurveysType = 'percentage', ohpSurveysFixed = 0) {
  const contractors = contractorMembers(normalizeContractorOhp(deliveryTeam, { surveysPct: ohpSurveysPct, riba57Pct: ohpRiba57Pct, surveysType: ohpSurveysType, surveysFixed: ohpSurveysFixed }));
  const stageRows = CONTRACTOR_STAGES.map(stage => ({ stage, label: CONTRACTOR_LABELS[stage], base: 0, ohp: 0 }));
  const hasStageOhp = contractors.length > 0;
  const hasLegacyOhp = false;
  const ohpS = Number(ohpSurveysPct) || 0, ohpR = Number(ohpRiba57Pct) || 0;
  contractors.forEach(member => {
    const bases = contractorStageBases(member);
    stageRows.forEach(row => {
      row.base += bases[row.stage];
      row.ohp += calculateStageOhp(bases[row.stage], member.contractor_ohp[row.stage]);
    });
  });
  stageRows.forEach(row => { row.ohp = Math.round(row.ohp * 100) / 100; row.total = row.base + row.ohp; });
  const surveysBase = stageRows.slice(0, 4).reduce((sum, row) => sum + row.base, 0);
  const surveysOhp = stageRows.slice(0, 4).reduce((sum, row) => sum + row.ohp, 0);
  const { base: riba57Base, ohp: riba57Ohp, total: riba57Total } = stageRows[4];
  const surveysTotal = surveysBase + surveysOhp;
  return {
    hasContractor: contractors.length > 0,
    hasStageOhp, hasLegacyOhp, stageRows,
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