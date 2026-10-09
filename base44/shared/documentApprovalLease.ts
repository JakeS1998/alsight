export const decisionLeaseActive = request => {
 const expiry = Date.parse(request.decision_lock_until || '');
 return Number.isFinite(expiry) && expiry > Date.now();
};
export const decisionCanRetry = (request, user) => Boolean(request.response && request.decided_by_id === user.id && !decisionLeaseActive(request) && ['error', 'pending'].includes(request.writeback_status));
export const availableDecisionLease = now => ({ $or: [
 { decision_lock_until: { $exists: false } },
 { decision_lock_until: { $in: [null, ''] } },
 { decision_lock_until: { $lte: now } }
] });