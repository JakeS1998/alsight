import React, { useMemo } from "react";
import { FormSection } from "@/components/forms/PowerForm";
import DesignTeamCard from '@/components/delivery/DesignTeamCard';
import { designTeamFees } from '@/components/delivery/designTeamFees';
import ChecklistHover from '@/components/delivery/ChecklistHover';
import { documentChecklistDetails } from '@/components/delivery/checklistDetails';

const APPT_ROLES = [
  { label: "Project Manager", type: "appointment_pm" },
  { label: "Principal Designer BR", type: "appointment_pd_br" },
  { label: "Principal Designer CDM", type: "appointment_pd_cdm" },
  { label: "Architect", type: "appointment_architect" },
];

export function DesignTeam({ legalDocs, jcts, warranties, accountMap, deliveryTeam = [], suppliers = [] }) {
  const cards = useMemo(() => {
    const out = [];
    APPT_ROLES.forEach((role) => {
      const doc = legalDocs.find((d) => d.document_type === role.type);
      out.push({
        label: role.label,
        details: [...documentChecklistDetails(doc, role.label), ...(doc && !accountMap[doc.account_id]?.name ? ['Missing: linked supplier name.'] : [])],
        supplierAccount: doc ? accountMap[doc.account_id] : null,
        appointed: !!doc,
        account: doc ? accountMap[doc.account_id]?.name : null,
        fee: doc?.total_fees,
        signed: doc?.executed === "yes",
        po: doc?.executed === "po",
        link: doc?.link_to_file,
      });
    });

    // Contractor from JCT (or contractor warranty)
    const jct = jcts.find((j) => j.executed === "yes") || jcts[0];
    const contractorName = jct ? (accountMap[jct.contractor_id]?.name || accountMap[jct.account_id]?.name) : null;
    out.push({
      label: "Contractor",
      details: jct ? documentChecklistDetails(jct, 'JCT contract') : warranties.some(w => w.category === 'contractor') ? ['Contractor identified from a warranty.', 'Missing: JCT contract record; contract sign-off cannot be confirmed.'] : ['Missing: JCT contract or contractor warranty.'],
      appointed: !!jct || warranties.some((w) => w.category === "contractor"),
      account: contractorName,
      supplierAccount: jct ? accountMap[jct.contractor_id] || accountMap[jct.account_id] : null,
      fee: null, signed: jct?.executed === "yes", po: false, link: jct?.link_to_file,
    });

    // Roles not yet tracked as dedicated docs
    ["Cost Consultant", "Structural Engineer", "M&E"].forEach((label) => out.push({ label, appointed: false, untracked: true, details: ['This role is not tracked by a dedicated appointment type in this matrix.', 'No appointment sign-off is available here; this does not confirm that the role is unappointed.'] }));
    return out.map(card => designTeamFees(card, deliveryTeam, suppliers));
  }, [legalDocs, jcts, warranties, accountMap, deliveryTeam, suppliers]);

  return (
    <FormSection title="4 · Design & Consultant Team" completed={cards.filter(card => !card.untracked).every(card => card.signed || card.po)} description="Reuses your appointment documents — no duplicate data entry">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => <ChecklistHover key={c.label} title={c.label} details={c.details}><div className="h-full"><DesignTeamCard {...c} /></div></ChecklistHover>)}
      </div>
    </FormSection>
  );
}