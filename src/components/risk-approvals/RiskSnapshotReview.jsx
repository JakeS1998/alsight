import React, { useState } from 'react';
import RiskIssuedSnapshot from '@/components/risk-approvals/RiskIssuedSnapshot';
import RiskRowCommentDialog from '@/components/risk-approvals/RiskRowCommentDialog';
import RiskFeedbackList from '@/components/risk-approvals/RiskFeedbackList';
export default function RiskSnapshotReview({ snapshot, packetId, challengeId, session, canComment }) {
  const [row, setRow] = useState(null);
  return <div className="space-y-4">
    <RiskIssuedSnapshot snapshot={snapshot} onComment={setRow} commentsDisabled={!canComment} />
    <RiskFeedbackList packetId={packetId} />
    {row && canComment && <RiskRowCommentDialog key={row.id} row={row} packetId={packetId} challengeId={challengeId} session={session} onClose={() => setRow(null)} />}
  </div>;
}