import React, { createContext, useCallback, useContext } from 'react';
import useSyncedPreferences from '@/components/adaptive/useSyncedPreferences';
import { loadWellbeing } from '@/components/wellbeing/wellbeingPreferences';
const WellbeingContext=createContext(null);
export const useWellbeing=()=>useContext(WellbeingContext);
export default function WellbeingProvider({user,children}) {
 const key=`alsight-wellbeing-v1:${user?.id}`;
 const sync=useSyncedPreferences(user?.id,'wellbeing',key,()=>loadWellbeing(user?.id)),settings=sync.value;
 const save=useCallback(changes=>sync.save(old=>({...changes,categories:{...old.categories,...changes.categories}})),[sync.save]);
 return <WellbeingContext.Provider value={{settings,save,error:sync.error,saving:sync.saving,ready:sync.ready,retry:sync.retry,userId:user?.id}}>{children}</WellbeingContext.Provider>;
}