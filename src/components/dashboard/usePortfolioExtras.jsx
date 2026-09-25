import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const EMPTY = { orders: [], proposals: [], deliveries: [], risks: [], actions: [] };
export default function usePortfolioExtras(enabled = true) {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    Promise.all([
      base44.entities.PurchaseOrder.list("-created_date", 5000),
      base44.entities.FeeProposal.list("-created_date", 5000),
      base44.entities.ProjectDelivery.list("-created_date", 5000),
      base44.entities.ProjectRisk.list("-created_date", 5000),
      base44.entities.ProjectAction.list("-created_date", 5000),
    ]).then(([orders, proposals, deliveries, risks, actions]) => {
      if (active) setData({ orders, proposals, deliveries, risks, actions });
    }).catch(() => { if (active) setError("Portfolio financial and risk data could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [enabled]);
  return { data, loading, error };
}