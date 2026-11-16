import React,{useState} from 'react';
import {Button} from '@/components/ui/button';
import {aseRequest,aseError} from '@/components/ase/aseClient';
export default function JCTFeeExtractButton({accountId,contractId,onSaved}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const extract=async()=>{setBusy(true);setError('');try{const data=await aseRequest('extractCommercialJCT',{accountId,contractId});onSaved();if(data.status!=='extracted')setError(data.note || 'No usable signed JCT contractor amount found.');}catch(e){setError(aseError(e));}finally{setBusy(false);}};
 return <div><Button variant="outline" size="sm" disabled={busy} onClick={extract}>{busy?'Reading signed JCT…':'Extract signed JCT amount'}</Button>{error&&<p role="alert" className="mt-1 text-xs text-destructive">{error}</p>}</div>;
}