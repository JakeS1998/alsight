export default function assignedRoles(user) {
  return [...new Set([user?.role, ...(user?.duty_roles || user?.data?.duty_roles || [])].filter(Boolean))];
}