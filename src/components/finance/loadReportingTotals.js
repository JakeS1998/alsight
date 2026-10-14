import {financeCall} from '@/components/finance/financeClient';
export default async function loadReportingTotals(){
  return financeCall({action:'summary'});
 }