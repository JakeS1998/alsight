import React, { useMemo } from "react";
import { FormSection } from "@/components/forms/PowerForm";
import DesignTeamCard from '@/components/delivery/DesignTeamCard';
import { designTeamFees } from '@/components/delivery/designTeamFees';
import ChecklistHover from '@/components/delivery/ChecklistHover';
import { documentChecklistDetails } from '@/components/delivery/checklistDetails';
import contractorAppointment from '@/components/delivery/contractorAppointment';

const APPT_ROLES = [
  { label: "Project Manager", type: "appointment_pm" },
  { label: "Principal Designer BR", type: "appointment_pd_br" },
  { label: "Principal Designer CDM", type: "appointment_pd_cdm" },
  { label: "Architect", type: "appointment_architect", optional: true },
];

export function DesignTeam({ legalDocs, jcts, warranties, accountMap, deliveryTeam = [], suppliers = [] }) {
  const cards = useMemo(() => {
    const out = [];
    APPT_ROLES.forEach((role) => {
      const doc = legalDocs.find((d) => d.document_type === role.type);
      out.push({
        label: role.label,
        optional: !!role.optional,
        details: [...(role.optional && !doc ? [] : documentChecklistDetails(doc, role.label)), ...(doc && !accountMap[doc.account_id]?.name ? ['Missing: linked supplier name.'] : []), ...(role.optional ? ['Architect appointment is optional and does not affect stage completion.'] : [])],
        supplierAccount: doc ? accountMap[doc.account_id] : null,
        appointed: !!doc,
        account: doc ? accountMap[doc.account_id]?.name : null,
        fee: doc?.total_fees,
        signed: doc?.executed === "yes",
        po: doc?.executed === "po",
        link: doc?.link_to_file,
      });
    });

    const appointment = contractorAppointment({ deliveryTeam, suppliers, accountMap, legalDocs });
    const jct = jcts.find((j) => j.executed === "yes") || jcts[0];
    const contractorDocument = appointment.document || jct;
    const contractorAccount = appointment.account || (jct ? accountMap[jct.contractor_id] || accountMap[jct.account_id] : null);
    out.push({
      label: "Contractor",
      details: contractorDocument ? [...documentChecklistDetails(contractorDocument, appointment.document ? 'Contractor appointment' : 'JCT contract'), ...(appointment.document ? ['Matched to the contractor in the Fee Proposal delivery team.'] : [])] : warranties.some(w => w.category === 'contractor') ? ['Contractor identified from a warranty.', 'Missing: contractor appointment document.'] : ['Missing: contractor appointment document.'],
      appointed: !!contractorDocument || warranties.some((w) => w.category === "contractor"),
      account: contractorAccount?.name,
      supplierAccount: contractorAccount,
      fee: null, signed: contractorDocument?.executed === "yes", po: contractorDocument?.executed === 'po', link: contractorDocument?.link_to_file,
    });

    // Roles not yet tracked as dedicated docs
    ["Cost Consultant", "Structural Engineer", "M&E"].forEach((label) => out.push({ label, appointed: false, untracked: true, details: ['This role is not tracked by a dedicated appointment type in this matrix.', 'No appointment sign-off is available here; this does not confirm that the role is unappointed.'] }));
    return out.map(card => ({ ...designTeamFees(card, deliveryTeam, suppliers), label: card.optional ? `${card.label} (optional)` : card.label }));
  }, [legalDocs, jcts, warranties, accountMap, deliveryTeam, suppliers]);

  return (
    <FormSection title="4 · Design & Consultant Team" completed={cards.filter(card => !card.untracked && !card.optional).every(card => card.signed || card.po)} description="Reuses your appointment documents — no duplicate data entry">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => <ChecklistHover key={c.label} title={c.label} details={c.details}><div className="h-full"><DesignTeamCard {...c} /></div></ChecklistHover>)}
      </div>
    </FormSection>
  );
}