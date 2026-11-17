// Use only after the caller's Account access has been checked with the user-scoped client.
// Assessment publication and evidence collection stay server-owned; callers never supply policy or scores.
export function compassAssessmentClient(base44) {
  return {entities:base44.asServiceRole.entities,functions:base44.asServiceRole.functions,integrations:base44.asServiceRole.integrations,asServiceRole:base44.asServiceRole,auth:base44.auth};
}