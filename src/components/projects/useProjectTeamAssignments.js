import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import contractorAppointment, { savedDeliveryTeam } from '@/components/delivery/contractorAppointment';

const roles = [
  ['Contractor', null], ['Principal Designer (CDM)', 'appointment_pd_cdm'],
  ['Principal Designer (BR)', 'appointment_pd_br'], ['Architect', 'appointment_architect'],
  ['Structural Engineer', null], ['M&E Engineer', null], ['Cost Consultant', null],
  ['Project Manager', 'appointment_pm'],
];
const normalise = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const currentFirst = rows => rows.filter(row => row.status !== 'inactive').sort((a, b) =>
  Number(['yes', 'po'].includes(b.executed)) - Number(['yes', 'po'].includes(a.executed)) ||
  String(b.updated_date || '').localeCompare(String(a.updated_date || '')));

export default function useProjectTeamAssignments({ project, accountMap, legalDocs, jcts }) {
  const delivery = useQuery({
    queryKey: ['project-team-assignments', project.id],
    queryFn: async () => (await base44.entities.ProjectDelivery.filter({ project_id: project.id },
      { sort: '-created_date', limit: 1, fields: ['delivery_team', 'contractor'] })).items[0] || null,
  });
  const accounts = Object.values(accountMap);
  const byId = {}, byNumber = {};
  accounts.forEach(account => {
    [account.id, account.dataverse_id].filter(Boolean).forEach(id => { byId[id] = account; });
    if (account.company_number) byNumber[normalise(account.company_number)] = account;
  });
  const team = savedDeliveryTeam(delivery.data), documents = currentFirst(legalDocs);
  const appointment = contractorAppointment({ deliveryTeam: team, accountMap: byId, legalDocs: documents });
  const jct = currentFirst(jcts)[0];
  const names = Object.fromEntries(roles.map(([label, type]) => {
    const doc = type ? documents.find(row => row.document_type === type) : null;
    const members = team.filter(member => normalise(member.role) === normalise(label));
    const selectedNames = [...new Set(members.map(member => byNumber[normalise(member.supplier_company_number)]?.name).filter(Boolean))];
    let name = doc ? byId[doc.account_id]?.name : null;
    if (label === 'Contractor') name = appointment.account?.name || byId[appointment.document?.account_id]?.name ||
      byId[jct?.contractor_id]?.name || byId[jct?.account_id]?.name;
    name ||= selectedNames.join(', ');
    if (label === 'Contractor' && !name && delivery.data?.contractor) name = byId[delivery.data.contractor]?.name || delivery.data.contractor;
    const identified = !!doc?.account_id || members.some(member => member.supplier_company_number) ||
      (label === 'Contractor' && !!(appointment.document?.account_id || jct?.contractor_id || jct?.account_id));
    return [label, name || (identified ? 'Supplier not identified' : delivery.isLoading ? 'Loading…' : delivery.error ? 'Unable to load assignment' : 'Not recorded')];
  }));
  return { names, assignments: roles.filter(([label]) => label !== 'Project Manager').map(([label]) => [label, names[label]]) };
}