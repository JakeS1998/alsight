import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import contractorAppointment, { savedDeliveryTeam } from '@/components/delivery/contractorAppointment';
import { useAuth } from '@/lib/AuthContext';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
import useProjectAssignmentSuppliers from '@/components/projects/useProjectAssignmentSuppliers';

const roles = [
  ['Contractor', null], ['Principal Designer (CDM)', 'appointment_pd_cdm'],
  ['Principal Designer (BR)', 'appointment_pd_br'], ['Architect', 'appointment_architect'],
  ['Structural Engineer', null], ['M&E Engineer', null], ['Cost Consultant', null],
  ['Project Manager', 'appointment_pm'],
];
const normalise = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const currentFirst = rows => rows.filter(row => row.status !== 'inactive' || ['yes', 'po'].includes(row.executed)).sort((a, b) =>
  Number(['yes', 'po'].includes(b.executed)) - Number(['yes', 'po'].includes(a.executed)) ||
  String(b.updated_date || '').localeCompare(String(a.updated_date || '')));

export default function useProjectTeamAssignments({ project, accountMap, legalDocs, jcts }) {
  const { user } = useAuth();
  const delivery = useQuery({
    queryKey: ['project-team-assignments', project.id, project.dataverse_id, user?.id, user?.role],
    enabled: !!user?.id, ...organisationQueryPolicy, staleTime: 300000,
    queryFn: async () => (await base44.entities.ProjectDelivery.filter({ project_id: { $in: [project.id, project.dataverse_id].filter(Boolean) } },
      { sort: '-updated_date', limit: 1, fields: ['delivery_team', 'contractor'] })).items[0] || null,
  });
  const team = savedDeliveryTeam(delivery.data), documents = currentFirst(legalDocs);
  const suppliers = useProjectAssignmentSuppliers({ project, team, legalDocs: documents, jcts, accountMap, delivery });
  const { byId, byNumber } = suppliers;
  const appointment = contractorAppointment({ deliveryTeam: team, accountMap: byId, legalDocs: documents });
  const jct = currentFirst(jcts)[0];
  const names = Object.fromEntries(roles.map(([label, type]) => {
    const doc = type ? documents.find(row => row.document_type === type) : null;
    const members = team.filter(member => normalise(member.role) === normalise(label));
    const selectedNames = [...new Set(members.map(member => byNumber[normalise(member.supplier_company_number)]?.name).filter(Boolean))];
    let name = selectedNames.join(', ') || (doc ? byId[doc.account_id]?.name : null);
    if (label === 'Contractor' && !name) name = appointment.account?.name || byId[appointment.document?.account_id]?.name ||
      byId[jct?.contractor_id]?.name || byId[jct?.account_id]?.name;
    if (label === 'Contractor' && !name && delivery.data?.contractor) name = byId[delivery.data.contractor]?.name || delivery.data.contractor;
    const identified = !!doc?.account_id || members.some(member => member.supplier_company_number) ||
      (label === 'Contractor' && !!(appointment.document?.account_id || jct?.contractor_id || jct?.account_id));
    return [label, name || (delivery.isFetching || suppliers.loading ? 'Loading…' : suppliers.error || delivery.error ? 'Unable to load assignment' : identified ? 'Supplier not identified' : 'Not recorded')];
  }));
  return { names, assignments: roles.filter(([label]) => label !== 'Project Manager').map(([label]) => [label, names[label]]) };
}