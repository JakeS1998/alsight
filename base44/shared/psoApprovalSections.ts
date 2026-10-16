export default function psoApprovalSections(rows) {
 const named = pattern => rows.filter(row => row.some(cell => pattern.test(String(cell).trim())));
 const pq = named(/^PQ\s+APPROVED\s*:/i);
 const aa = named(/^AA\s+(?:(?:FEASIBILITY|RIBA\s*\[?\s*(?:[0-7]|x)\s*\]?(?:\s*(?:[-–/&]|and|to)\s*\[?\s*[0-7]\s*\]?)?)\s+)?APPROVED\b/i)
  .filter(row => row.some(cell => /^APPROVED\s+BY\s*:/i.test(String(cell).trim())));
 const feasibility = aa.filter(row => row.some(cell => /^AA\s+FEASIBILITY\s+APPROVED\b/i.test(String(cell).trim())));
 const explicitVariations = named(/^AA\s+VARIATIONS?\s+APPROVED\b/i);
 // Older reports name the initial AA "Feasibility" and its follow-on by RIBA stage.
 // Only use this fallback when a unique initial section exists; duplicate follow-ons
 // remain ambiguous and are rejected by the caller, never guessed or combined.
 const followOn = feasibility.length === 1 ? aa.filter(row => !feasibility.includes(row)) : [];
 const variations = explicitVariations.length ? explicitVariations : followOn;
 const warnings = !explicitVariations.length && followOn.length === 1
  ? ['AA_VARIATIONS: using the subsequent RIBA-labelled AA approval following the initial AA feasibility section.'] : [];
 return {sections: [['pq', pq], ['aa', feasibility.length ? feasibility : aa], ['aa_variations', variations]], warnings};
}