import React,{useState} from 'react';
import {base44} from '@/api/base44Client';
import {coCall} from '@/components/contingency/live/useContingencyOperations';
import {Button} from '@/components/ui/button';
import downloadContingencyFile from '@/components/contingency/live/downloadContingencyFile';
export default function COChangeAttachment({change}){const[busy,setBusy]=useState(false),[error,setError]=useState('');if(!change.details.file_uri)return null;async function open(){setBusy(true);setError('');try{const r=await coCall('change_file',{id:change.id});await downloadContingencyFile(r);}catch(e){setError(e.response?.data?.error||e.message);}finally{setBusy(false);}}return <div><Button variant="outline" disabled={busy} onClick={open}>Review private attachment</Button>{error&&<p role="alert" className="text-xs text-destructive">{error}</p>}</div>;}