import React from 'react';
import SearchHighlight from '@/components/search/SearchHighlight';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import { Link } from 'react-router-dom';
import AccountBadges from '@/components/accounts/AccountBadges';
import ASERating from '@/components/accounts/ASERating';
import { formatCurrency, formatDate, INTERNAL_ROLES } from '@/lib/portal';
import { useAuth } from '@/lib/AuthContext';
export default function AccountList({ rows, directoryPath,searchTerm }) {
  const {user}=useAuth(); const internal=INTERNAL_ROLES.includes(user?.role);
  const money = rows.some(row => row.signals.liveValue != null);
  return <div className="account-list"><table><thead><tr><th>Organisation</th><th>Primary location</th><th>Owner</th><th>Active projects</th><th>Open opportunities</th>{money && <th>Live project value</th>}<th>Last interaction</th><th>Identifier</th>{internal && <th>All Seeing Eye</th>}</tr></thead><tbody>{rows.map(({ account,signals }) => <tr key={account.id}><td><Link className="font-semibold hover:underline" to={`/accounts/${account.id}`} state={{directoryPath}}><SearchHighlight text={account.name} term={searchTerm}/></Link><AccountBadges account={account} /><RecordUpdatedAt record={account} className="mt-2" /></td><td><SearchHighlight text={[account.address_city,account.address_postcode].filter(Boolean).join(' · ') || 'Not recorded'} term={searchTerm}/></td><td>{signals.owner}</td><td>{signals.activeProjects}</td><td>{signals.openOpportunities}</td>{money && <td>{formatCurrency(signals.liveValue)}</td>}<td>{signals.lastInteraction ? formatDate(signals.lastInteraction) : 'Not recorded'}</td><td><SearchHighlight text={account.company_number || account.local_authority_code || account.public_body_identifier || '—'} term={searchTerm}/></td>{internal && <td><ASERating account={account} compact /></td>}</tr>)}</tbody></table></div>;
}