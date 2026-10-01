import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
const executed = { $or: [{ executed: { $in: ['yes', 'po'] } }, { date_of_execution: { $exists: true, $nin: [null, ''] } }] };
const pending = { $and: [{ executed: { $nin: ['yes', 'po'] } }, { $or: [{ date_of_execution: { $exists: false } }, { date_of_execution: { $in: [null, ''] } }] }] };
export default function useProject360(project) {
  return useQuery({
    queryKey: ['project-360', project.id, project.dataverse_id], staleTime: 60000,
    queryFn: async () => {
      const scope = { project_id: { $in: [project.id, project.dataverse_id].filter(Boolean) } };
      const legalScope = { ...scope, $or: [{ status: { $ne: 'inactive' } }, executed] };
      const [delivery, legal, dmaSigned, alternativeSigned, outstanding] = await Promise.all([
        base44.entities.ProjectDelivery.filter({ project_id: project.id }, { sort: '-updated_date', limit: 1 }),
        Promise.all(['LegalDocument', 'DMA', 'JCT'].map(async name => {
          const [total, incomplete] = await Promise.all([base44.entities[name].count(legalScope), base44.entities[name].count({ $and: [legalScope, pending] })]);
          return { total, incomplete };
        })),
        base44.entities.DMA.count({ ...scope, pso_signoff: 'yes' }),
        base44.entities.LegalDocument.count({ ...scope, document_type: { $in: ['equipment_only_agreement', 'single_task_agreement'] }, pso_signoff: true }),
        base44.entities.Warranty.count({ ...scope, status: { $ne: 'inactive' }, warranty_status: { $nin: ['executed', 'product_warranty'] }, $or: [{ date_of_execution: { $exists: false } }, { date_of_execution: { $in: [null, ''] } }] }),
      ]);
      return { delivery: delivery.items[0] || {}, legalTotal: legal.reduce((sum, result) => sum + result.total, 0), legalPending: legal.reduce((sum, result) => sum + result.incomplete, 0), dmaSigned: dmaSigned > 0, alternativeSigned: alternativeSigned > 0, outstanding };
    },
  });
}