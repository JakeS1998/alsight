import { flowConfig, sharedFlowContext, flowRequest } from './dataverseFlowApi.ts';
export async function recalculateBlankPOHeaders(base44) {
 const context = await sharedFlowContext(base44, await flowConfig(base44));
 const request = path => flowRequest(context.environment, context.token, path);
 const query = new URLSearchParams({ '$select': 'cr78c_purchase_orderid,cr78c_name', '$filter': 'statecode eq 0 and cr78c_total_net_value eq null', '$orderby': 'cr78c_purchase_orderid asc', '$top': '100', '$count': 'true' });
 const page = await request(`cr78c_purchase_orders?${query}`);
 const rows = page.value || [], failures = [];
 let calculated = 0;
 const deadline = Date.now() + 170000;
 for (let offset = 0; offset < rows.length && Date.now() < deadline; offset += 4) {
  const group = rows.slice(offset, offset + 4);
  const results = await Promise.allSettled(group.map(async row => {
   const parameters = new URLSearchParams({ '@target': JSON.stringify({ '@odata.id': `cr78c_purchase_orders(${row.cr78c_purchase_orderid})` }), '@field': "'cr78c_total_net_value'" });
   const result = await request(`CalculateRollupField(Target=@target,FieldName=@field)?${parameters}`);
   if (typeof result?.cr78c_total_net_value !== 'number' || !Number.isFinite(result.cr78c_total_net_value)) throw new Error(`Dataverse did not populate the PO header total (rollup state ${result?.cr78c_total_net_value_state ?? 'not supplied'}).`);
  }));
  results.forEach((result, index) => {
   if (result.status === 'fulfilled') calculated++;
   else failures.push({ reference: group[index].cr78c_name, error: String(result.reason?.message || 'Recalculation failed').slice(0, 400) });
  });
  if (failures.length) break;
 }
 const remainingQuery = new URLSearchParams({ '$select': 'cr78c_purchase_orderid', '$filter': 'statecode eq 0 and cr78c_total_net_value eq null', '$count': 'true', '$top': '1' });
 const remaining = (await request(`cr78c_purchase_orders?${remainingQuery}`))['@odata.count'];
 return { calculated, remaining, completed: remaining === 0, failures };
}