import {financeCall} from '@/components/finance/financeClient';
export default async function loadReportingTotals(){
 let timer;
 try{
  return await Promise.race([
   financeCall({action:'summary'}),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Reporting totals took too long to load. Please try again.')),45000);})
  ]);
 }finally{clearTimeout(timer);}
}