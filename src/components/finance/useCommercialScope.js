import { useAuth } from '@/lib/AuthContext';
export default function useCommercialScope() {
 const {user}=useAuth();
 return JSON.stringify([user?.id,user?.role,user?.data,user?.account_id,user?.region,user?.delegate_region,user?.staff_aad_id,user?.dataverse_systemuser_id,user?.delegate_of]);
}