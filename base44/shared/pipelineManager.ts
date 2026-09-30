export async function assignStaffManager(db, employeeId, managerId) {
  await db.User.update(employeeId, { line_manager_id: managerId });
  for (const name of ['Opportunity', 'CRMTask', 'CRMActivity', 'Conversation', 'CRMProjectLink']) {
    let result;
    do { result = await db[name].updateMany({ owner_id: employeeId, line_manager_id: { $ne: managerId } }, { $set: { line_manager_id: managerId } }); } while (result.has_more);
  }
}