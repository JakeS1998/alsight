import React from 'react';
export default function RiskRegisterGuidance() {
  return <details className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
    <summary className="cursor-pointer font-medium">Guidance &amp; 5 × 5 risk matrix</summary>
    <p className="mt-3">Risk index = probability rating × impact rating. Weighted cost = anticipated cost × risk index ÷ 25, matching the supplied workbook.</p>
    <table className="mt-3 text-center text-xs"><caption className="mb-2 text-left">Probability down · Impact across</caption><thead><tr><th className="p-2">P / I</th>{[1,2,3,4,5].map(n => <th className="p-2" key={n}>{n}</th>)}</tr></thead><tbody>{[1,2,3,4,5].map(p => <tr key={p}><th className="p-2">{p}</th>{[1,2,3,4,5].map(i => <td className="border border-border p-2" key={i}>{p*i}</td>)}</tr>)}</tbody></table>
    <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground"><li>Use clear, specific, actionable descriptions.</li><li>Attribute every risk to Client or Contractor, not ALS or an unspecified shared owner.</li><li>State the full legal names of the parties in the project details and delivery information.</li><li>The Project Manager maintains the register, coordinates mitigation, and obtains Client and Contractor approval before project sign-off.</li><li>Cross-check contractor proposal exclusions and record Client risks; close eliminated risks as the project evolves.</li></ul>
    <p className="mt-3 text-xs text-muted-foreground">All weighted values are indicative: they are not explicit contractual values and are not capped.</p>
  </details>;
}