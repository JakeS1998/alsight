import { CONTRACTOR_STAGES, CONTRACTOR_LABELS, contractorStageBases, calculateStageOhp } from '@/components/delivery/contractorFeeRows';
const SURVEY_STAGES = CONTRACTOR_STAGES.slice(0, 4);

export const isContractorMember = (m) => String(m?.role || '').trim().toLowerCase() === 'contractor';

export function contractorMembers(deliveryTeam) {
  return (deliveryTeam || []).filter(isContractorMember);
}

export function contractorBuildUp(deliveryTeam, ohpSurveysPct, ohpRiba57Pct, ohpSurveysType = 'percentage', ohpSurveysFixed = 0) {
  const contractors = contractorMembers(deliveryTeam);
  const stageRows = CONTRACTOR_STAGES.map(stage => ({ stage, label: CONTRACTOR_LABELS[stage], base: 0, ohp: 0 }));
  const legacyBases = Object.fromEntries(CONTRACTOR_STAGES.map(stage => [stage, 0]));
  const hasStageOhp = contractors.some(member => member.contractor_ohp !== null);
  const hasLegacyOhp = contractors.some(member => member.contractor_ohp === null);
  contractors.forEach(member => {
    const bases = contractorStageBases(member);
    stageRows.forEach(row => {
      row.base += bases[row.stage];
      if (member.contractor_ohp !== null) row.ohp += calculateStageOhp(bases[row.stage], member.contractor_ohp?.[row.stage]);
      else legacyBases[row.stage] += bases[row.stage];
    });
  });
  const ohpS = Number(ohpSurveysPct) || 0, ohpR = Number(ohpRiba57Pct) || 0;
  const legacySurveysBase = SURVEY_STAGES.reduce((sum, stage) => sum + legacyBases[stage], 0);
  const legacySurveysOhp = !hasLegacyOhp ? 0 : ohpSurveysType === 'fixed'
    ? Math.round((Number(ohpSurveysFixed) || 0) * 100) / 100 : Math.round(legacySurveysBase * ohpS) / 100;
  let allocated = 0;
  const lastStage = [...SURVEY_STAGES].reverse().find(stage => legacyBases[stage]) || 'riba_1';
  stageRows.forEach(row => {
    let legacyOhp = 0;
    if (row.stage === 'riba_5_7') legacyOhp = Math.round(legacyBases[row.stage] * ohpR) / 100;
    else if (row.stage !== lastStage) { legacyOhp = legacySurveysBase ? Math.round(legacySurveysOhp * legacyBases[row.stage] / legacySurveysBase * 100) / 100 : 0; allocated += legacyOhp; }
    row.ohp += legacyOhp;
  });
  stageRows.find(row => row.stage === lastStage).ohp += legacySurveysOhp - allocated;
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