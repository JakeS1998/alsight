const achieved = value => Boolean(value && Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now());
export default function deliveryStageCompletion(project, savedDelivery) {
  const delivery = savedDelivery || {};
  const pcAchieved = achieved(delivery.pc_achieved || project.practical_completion_date);
  return {
    'opportunity & scoping': delivery.feasibility_status === 'complete',
    construction: pcAchieved,
    'practical completion & close-out': pcAchieved && delivery.final_account_status === 'closed' && ['om_manuals', 'hs_file', 'warranties_status', 'training', 'asset_info', 'client_handover'].every(key => delivery[key] === 'complete'),
  };
}