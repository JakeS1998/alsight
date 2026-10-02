import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useRiskApprovalAction from '@/components/risk-approvals/useRiskApprovalAction';
export default function useRiskAcceptance(packetId) {
  const [challengeId, setChallengeId] = useState('');
  const [session, setSession] = useState('');
  const [snapshot, setSnapshot] = useState(null);
  const [message, setMessage] = useState('');
  const query = useQuery({ queryKey: ['risk-acceptance', packetId], queryFn: async () => (await base44.functions.invoke('manageRiskApprovals', { action: 'review', packet_id: packetId })).data, refetchInterval: 30000 });
  const action = useRiskApprovalAction(async (data, payload) => {
    if (payload.action === 'send_code') { setChallengeId(data.challenge_id); setSession(''); setSnapshot(null); setMessage('Verification code sent to your registered email.'); }
    if (payload.action === 'verify') { setSession(data.verification_session); setSnapshot(data.snapshot); setMessage('Email verified. Review the full issued register below.'); }
    if (['accept', 'reject'].includes(payload.action)) { setSession(''); setMessage(payload.action === 'accept' ? 'Your acceptance has been recorded.' : 'Your decline has been recorded and the sequence has stopped.'); await query.refetch(); }
  });
  const send = () => action.run({ action: 'send_code', packet_id: packetId });
  const verify = code => action.run({ action: 'verify', packet_id: packetId, challenge_id: challengeId, code });
  const decide = (decision, values) => action.run({ action: decision, packet_id: packetId, challenge_id: challengeId, verification_session: session, ...values });
  return { query, action, challengeId, session, snapshot, message, send, verify, decide };
}