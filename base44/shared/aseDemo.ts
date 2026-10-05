import { createAssessment } from './aseAssessment.ts';
export async function seedDemo(base44,policy) {
  const examples=[{name:'ASE Demo — UK Company (fictional)',account_type:'supplier',organisation_type:'uk_limited_company',company_type:'ltd',values:[30,6,1.5,18,'5','5'],before:[15,1,1.1,30,'5','5']},{name:'ASE Demo — English Council (fictional)',account_type:'client',organisation_type:'english_local_authority',address_country:'England',values:[25,1,8,0.5,'5','4','5'],before:[15,-1,12,1.5,'5','4','5']}];
  const accounts=[];
  for (const example of examples) {
    const {values,before,...fields}=example;
    const existing=await base44.entities.Account.filter({name:example.name},{limit:1});
    const account=existing.items[0] || await base44.entities.Account.create({...fields,status:'active',relationship_summary:'Fictional ASE demonstration only. Not a real organisation or financial assessment.'});
    const model=example.company_type ? 'company' : 'english_local_authority';
    if (!await base44.entities.ASEAssessment.count({account_id:account.id,status:'published'})) {
      if (!await base44.entities.ASEEvidence.count({account_id:account.id,assessment_id:null})) {
        const rows=policy.models[model].flatMap((rule,i)=>(rule.choices ? ['2026-03-31'] : ['2024-03-31','2025-03-31','2026-03-31']).map(period=>({account_id:account.id,assessment_id:null,component:rule.key,source:'Fictional ASE demonstration pack',evidence_type:rule.type,title:`Demo ${rule.label}`,value:String(before[i]),previous_value:'',reporting_period:period,source_date:'2026-09-30',retrieval_date:new Date().toISOString(),severity:rule.choices && Number(before[i])<3 ? 'material' : 'none',confidence:'High',source_reference:`DEMO ONLY / ${model} / ${period} / ${rule.key}`,notes:'Synthetic evidence for demonstrating ASE. Do not use for real decisions.',currency:'GBP',period_months:12,is_demo:true})));
        await base44.entities.ASEEvidence.bulkCreate(rows);
      }
      await createAssessment(base44,account,policy);
      await base44.entities.ASEEvidence.bulkCreate(policy.models[model].filter(rule=>!rule.choices).map(rule=>({account_id:account.id,assessment_id:null,component:rule.key,source:'Fictional ASE demonstration pack revision 2',evidence_type:rule.type,title:`Demo ${rule.label} revised`,value:String(values[policy.models[model].findIndex(r=>r.key===rule.key)]),previous_value:String(before[policy.models[model].findIndex(r=>r.key===rule.key)]),reporting_period:'2026-03-31',source_date:'2026-10-01',retrieval_date:new Date().toISOString(),severity:'none',confidence:'High',source_reference:`DEMO ONLY / ${model} / revised / ${rule.key}`,notes:'Synthetic revised figures, demonstrating historical comparison.',currency:'GBP',period_months:12,is_demo:true})));
      await createAssessment(base44,account,policy);
    }
    accounts.push({id:account.id,name:account.name});
  }
  return accounts;
}