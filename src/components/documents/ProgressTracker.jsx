import React from "react";
import { Check, Circle, Clock } from "lucide-react";

/**
 * Horizontal progress tracker matching the PowerApps form aesthetic.
 * @param steps - array of { label, state: "done" | "active" | "pending" }
 */
export function ProgressTracker({ steps }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                  step.state === "done"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : step.state === "active"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-slate-300 bg-white text-slate-300"
                }`}
              >
                {step.state === "done" ? (
                  <Check className="h-4 w-4" />
                ) : step.state === "active" ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium leading-tight text-center ${
                  step.state === "pending" ? "text-slate-400" : "text-slate-700"
                }`}
                style={{ maxWidth: 80 }}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 flex-1 min-w-[20px] rounded-full transition-colors ${
                  steps[i + 1].state === "done" || step.state === "done" ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// If the final (Execution) step is done, all prior steps are assumed done.
function withExecutionRule(steps) {
  if (steps.length && steps[steps.length - 1].state === "done") {
    return steps.map((s) => ({ ...s, state: "done" }));
  }
  return steps;
}

// Helper: compute progress steps for a legal document
export function getLegalDocSteps(doc) {
  return withExecutionRule([
    { label: "Drafted", state: doc.drafted_date ? "done" : "pending" },
    {
      label: "ALS Approval",
      state: doc.approval_status === "Approved" || doc.approval_status === "Approved - Subject to comments"
        ? "done"
        : doc.approval_date
        ? "done"
        : doc.drafted_date
        ? "active"
        : "pending",
    },
    {
      label: "Sent for Signing",
      state: doc.sent_to_client ? "done" : doc.approval_date || doc.approval_status?.startsWith("Approved")
        ? "active"
        : "pending",
    },
    {
      label: "Execution",
      state: doc.executed === "yes" || doc.date_of_execution ? "done" : doc.sent_to_client ? "active" : "pending",
    },
  ]);
}

// Helper: compute progress steps for a DMA
export function getDMASteps(doc) {
  const psoDone = doc.pso_signoff === "yes";
  return withExecutionRule([
    { label: "PSO Checks", state: psoDone ? "done" : "active" },
    { label: "Drafted", state: doc.drafted_date ? "done" : "pending" },
    {
      label: "ALS Approval",
      state: doc.approval_status?.startsWith("Approved") ? "done" : doc.drafted_date ? "active" : "pending",
    },
    {
      label: "Execution",
      state: doc.executed === "yes" || doc.date_of_execution ? "done" : doc.sent_for_signing ? "active" : "pending",
    },
  ]);
}

// Helper: compute progress steps for a JCT
export function getJCTSteps(doc) {
  return withExecutionRule([
    { label: "Governance", state: doc.contract_particulars === "yes" ? "done" : "active" },
    { label: "Drafting", state: doc.drafted_date ? "done" : "pending" },
    {
      label: "ALS Approval",
      state: doc.sent_for_signing ? "done" : doc.drafted_date ? "active" : "pending",
    },
    {
      label: "Execution",
      state: doc.executed === "yes" || doc.date_of_execution ? "done" : doc.sent_for_signing ? "active" : "pending",
    },
  ]);
}