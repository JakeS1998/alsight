import React from 'react';
import { FormField, formInputClass } from '@/components/forms/PowerForm';
import { taskMemberAmounts } from '@/components/delivery/singleTaskFees';
import { isContractorMember } from '@/components/delivery/contractorBuildUp';

export default function TaskMemberFee({ member, onChange }) {
  const { total, ohp } = taskMemberAmounts(member);
  return <div className="grid gap-3 sm:grid-cols-2">
    <FormField label="Task fee total (£)" help="One total for the task, including any contractor OHP.">
      <input aria-label={`${member.role || 'Supplier'} task fee total`} type="number" min="0" step="0.01" value={member.task_fee ?? total} onChange={event => onChange({ task_fee: event.target.value, task_ohp: Math.min(Number(event.target.value) || 0, ohp) })} className={formInputClass} />
    </FormField>
    {isContractorMember(member) && <FormField label="OHP included in total (£)" help="For internal FSF calculation only; not added again to the task total.">
      <input aria-label="OHP included in task total" type="number" min="0" max={total} step="0.01" value={member.task_ohp ?? ohp} onChange={event => onChange({ task_fee: total, task_ohp: Math.min(total, Math.max(0, Number(event.target.value) || 0)) })} className={formInputClass} />
    </FormField>}
  </div>;
}