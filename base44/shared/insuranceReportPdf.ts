import {jsPDF} from 'npm:jspdf@4.2.1';
import {insuranceReportDate} from './insuranceReportDates.ts';
export function insuranceReportPdf(report) {
 const doc=new jsPDF({unit:'pt',format:'a4'}),width=515,bottom=790,columns=[225,95,100,95];let y=90;
 doc.setProperties({title:'ALS Hub insurance expiry report',author:'ALS Hub'});
 const clean=value=>String(value).replace(/[\u2013\u2014]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"');
 const page=()=>{doc.addPage();y=90;};
 const text=(value,size=10,bold=false)=>{
  doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor('#102642');
  for(const line of doc.splitTextToSize(clean(value),width)){if(y+size*1.5>bottom)page();doc.text(line,40,y);y+=size*1.5;}y+=8;
 };
 text('Monthly insurance expiry report',22,true);
 text(`${report.report_date} to ${report.window_end}, inclusive`);
 text(`${report.expired_count} expired policies | ${report.expiring_count} expiring within 28 days`,12,true);
 text('Active supplier policies only. Renewal dates use Europe/London calendar days. Policies without a renewal date, clients and internal accounts are excluded.',9);
 const headings=()=>{doc.setFillColor('#EAF4FB');doc.rect(40,y,width,25,'F');doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor('#102642');let x=46;['Policy / number','Cover','Renewal date','Timing'].forEach((label,i)=>{doc.text(label,x,y+16);x+=columns[i];});y+=25;};
 let category='',supplier='';
 for(const row of report.export_rows){
  if(category!==row.category){if(y>bottom-110)page();text(row.category,16,true);category=row.category;supplier='';}
  if(supplier!==row.supplier){if(y>bottom-90){page();text(category+' (continued)',13,true);}text(row.supplier,12,true);doc.link(40,y-26,width,20,{url:row.supplier_url});supplier=row.supplier;headings();}
  doc.setFont('helvetica','normal');doc.setFontSize(9);
  const values=[`${row.policy}\nPolicy number: ${row.number}${row.source_url?'\nOpen in Power Apps':''}`,row.cover==null?'Not recorded':new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(row.cover),insuranceReportDate(row.renewal+'T12:00:00Z'),row.timing];
  const lines=values.map((value,i)=>doc.splitTextToSize(clean(value),columns[i]-12)),total=Math.max(...lines.map(value=>value.length));let offset=0;
  while(offset<total){
   if(y+30>bottom){page();text(`${row.category} / ${row.supplier} (continued)`,11,true);headings();}
   const count=Math.min(total-offset,Math.max(1,Math.floor((bottom-y-12)/12))),height=count*12+12;
   doc.setFillColor(row.days<0?'#FFF5F5':'#FFFFFF');doc.rect(40,y,width,height,'F');doc.setDrawColor('#D4E3ED');doc.line(40,y+height,555,y+height);doc.setFont('helvetica','normal');doc.setFontSize(9);let x=46;
   lines.forEach((value,i)=>{doc.setTextColor(row.days<0&&i>=2?'#A33A3A':'#102642');const part=value.slice(offset,offset+count);if(part.length)doc.text(part,x,y+15,{lineHeightFactor:1.333});x+=columns[i];});
   if(row.source_url)doc.link(40,y,columns[0],height,{url:row.source_url});y+=height;offset+=count;
  }
  y+=5;
 }
 if(!report.export_rows.length)text('No expired policies or policies expiring within the next 28 days.');
 const pages=doc.getNumberOfPages();
 for(let n=1;n<=pages;n++){doc.setPage(n);doc.setFillColor('#F59929');doc.rect(0,0,595.28,52,'F');doc.setFont('helvetica','bold');doc.setFontSize(16);doc.setTextColor('#102642');doc.text('ALS Hub | Insurance report',40,33);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor('#5F7586');doc.text(`Prepared ${report.report_date} | Active supplier insurance`,40,818);doc.text(`${n} / ${pages}`,555,818,{align:'right'});}
 return new Uint8Array(doc.output('arraybuffer'));
}