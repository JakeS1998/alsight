import {useCallback} from 'react';
export default function useAliceLookup({options,value,onChange,label,resolve}){
 return useCallback(node=>{if(node)node.alicePrefill={options,value,onChange,label,resolve};},[options,value,onChange,label,resolve]);
}