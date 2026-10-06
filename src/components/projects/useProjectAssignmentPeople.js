import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
import { projectStaffName } from '@/components/projects/projectStaffName';

export default function useProjectAssignmentPeople(project) {
  const { user } = useAuth();
  const ids = [project.bdm_aad_id, project.bsm_aad_id].filter(Boolean);
  const staff = useQuery({
    queryKey: ['project-record-owners', 'user-first', project.id, user?.id, user?.role, ...ids],
    enabled: ids.length > 0 && !!user?.id && user?.role !== 'supplier', ...organisationQueryPolicy, staleTime: 300000,
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getProjectBDMManager', { action: 'staff_names', projectId: project.id });
      if (data.error) throw new Error(data.error);
      return data.names;
    },
  });
  const contactIds = [project.project_manager_id, project.client_rep_id].filter(Boolean);
  const contacts = useQuery({
    queryKey: ['project-assignment-contacts', project.id, user?.id, user?.role, ...contactIds],
    enabled: contactIds.length > 0 && !!user?.id, ...organisationQueryPolicy, staleTime: 300000,
    queryFn: async () => (await base44.entities.Contact.filter({ $or: [{ id: { $in: contactIds } }, { dataverse_id: { $in: contactIds } }] },
      { limit: 50, fields: ['full_name', 'first_name', 'last_name', 'dataverse_id'] })).items,
  });
  const director = useQuery({
    queryKey: ['project-assignment-director', project.id, project.bdm_aad_id, user?.id, user?.role],
    enabled: !!project.bdm_aad_id && !!user?.id, ...organisationQueryPolicy, staleTime: 300000,
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getProjectBDMManager', { projectId: project.id });
      if (data.error) throw new Error(data.error);
      return data.managerName || '';
    },
  });
  const staffMap = { ...staff.data };
  [user?.id, user?.staff_aad_id, user?.data?.staff_aad_id].filter(Boolean).forEach(id => { if (user?.full_name) staffMap[id] = user.full_name; });
  const contactMap = {};
  (contacts.data || []).forEach(person => [person.id, person.dataverse_id].filter(Boolean).forEach(id => { contactMap[id] = person.full_name || [person.first_name, person.last_name].filter(Boolean).join(' '); }));
  const fallback = query => query.isFetching ? 'Loading…' : query.error ? 'Unable to load name' : 'Assigned; name unavailable';
  return {
    staffName: id => projectStaffName(id, staffMap) || (id ? fallback(staff) : 'Not assigned'),
    contactName: id => contactMap[id] || (id ? fallback(contacts) : null),
    directorName: director.data || (project.bdm_aad_id ? fallback(director) : 'Not assigned'),
  };
}