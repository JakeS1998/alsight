import { additionalFeeStages, additionalFeeTotal } from '@/components/delivery/additionalFeeStages';
const isRiba57 = stage => /^riba[\s_]*5[\s_–—-]*7$/i.test(String(stage || '').trim());

export default function feePdfScope(supplierLines, alsLines, contractorBuild, includeRiba57) {
  if (includeRiba57) return { supplierLines, alsLines, contractorBuild };
  const scopedLines = alsLines.flatMap(line => {
    const entries = Object.entries(additionalFeeStages(line));
    const retained = entries.filter(([stage]) => !isRiba57(stage));
    if (entries.length && !retained.length) return [];
    const scoped = { ...line, stage_fees: Object.fromEntries(retained) };
    return [{ ...scoped, internal_fee: additionalFeeTotal(scoped) }];
  });
  const build = contractorBuild ? {
    ...contractorBuild,
    stageRows: contractorBuild.stageRows.filter(row => row.stage !== 'riba_5_7'),
    riba57Base: 0, riba57Ohp: 0, riba57Total: 0,
    rawTotal: contractorBuild.surveysBase,
    ohpTotal: contractorBuild.surveysOhp,
    total: contractorBuild.surveysTotal,
  } : contractorBuild;
  return { supplierLines: supplierLines.filter(line => !isRiba57(line.riba_stage) && line.fee_category !== 'authorised_activity'), alsLines: scopedLines, contractorBuild: build };
}