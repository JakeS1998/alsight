import {insuranceReportPdf} from './insuranceReportPdf.ts';
import {insuranceReportExcel} from './insuranceReportExcel.ts';
const encoded=bytes=>{let binary='';for(let offset=0;offset<bytes.length;offset+=16384)binary+=String.fromCharCode(...bytes.subarray(offset,offset+16384));return btoa(binary);};
export async function insuranceReportAttachments(report) {
 if(!Array.isArray(report.export_rows)||report.export_rows.length>5000)throw new Error('Insurance attachments exceed the safe report size.');
 const pdf=insuranceReportPdf(report),excel=await insuranceReportExcel(report),name=`ALS-Hub-Insurance-Report-${report.report_day}`;
 if(pdf.length>5*1024*1024||excel.length>5*1024*1024||pdf.length+excel.length>10*1024*1024)throw new Error('Insurance report attachments exceed the email size limit.');
 return [{filename:`${name}.pdf`,content:encoded(pdf)},{filename:`${name}.xlsx`,content:encoded(excel)}];
}