import ExcelJS from 'npm:exceljs@4.4.0';
import {insuranceReportCategoryOrder} from './insuranceReportCategory.ts';
export async function insuranceReportExcel(report) {
 const book=new ExcelJS.Workbook();book.creator='ALS Hub';book.created=new Date();
 const overview=book.addWorksheet('Report overview');overview.columns=[{width:35},{width:75}];
 const entries=[['ALS Hub','Insurance expiry report'],['Report date',report.report_date],['Window ends',report.window_end],['Expired policies',report.expired_count],['Expiring within 28 days',report.expiring_count],['Scope','Active supplier policies only, grouped by category and supplier.'],['Dates','Dataverse renewal dates, Europe/London calendar days.'],['Exclusions','Policies without renewal dates, client and internal accounts.'],['Report links',{text:'Review account insurance',hyperlink:'https://als-hub.base44.app/suppliers'}]];
 entries.forEach(values=>overview.addRow(values));
 overview.eachRow((row,n)=>{
  row.font={name:'Arial',size:n===1?16:11,color:{argb:'FF102642'},bold:n===1};row.alignment={vertical:'top',wrapText:true};row.height=n===1?40:32;
  row.eachCell(cell=>{cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:n===1?'FFF59929':'FFEAF4FB'}};});
 });
 const headers=['Supplier','Policy','Policy number','Cover (GBP)','Renewal date','Timing','Days to renewal','Supplier record','Power Apps record'];
 for(const [index,category] of insuranceReportCategoryOrder.entries()){
  const records=report.export_rows.filter(row=>row.category===category);
  const sheet=book.addWorksheet(category,{views:[{state:'frozen',ySplit:3}],pageSetup:{paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0}});
  sheet.mergeCells('A1:I1');sheet.getCell('A1').value=category;sheet.getCell('A1').font={name:'Arial',size:16,bold:true,color:{argb:'FF102642'}};sheet.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF59929'}};sheet.getRow(1).height=34;
  sheet.mergeCells('A2:I2');sheet.getCell('A2').value=`${report.report_date} to ${report.window_end} | ${records.length} policies`;sheet.getRow(2).height=26;
  const rows=records.map(r=>[r.supplier,r.policy,r.number,r.cover,new Date(r.renewal+'T12:00:00Z'),r.timing,r.days,{text:'Open supplier',hyperlink:r.supplier_url},r.source_url?{text:'Open in Power Apps',hyperlink:r.source_url}:'Not available']);
  if(rows.length)sheet.addTable({name:`InsuranceCategory${index+1}`,ref:'A3',headerRow:true,style:{theme:'TableStyleMedium2',showRowStripes:true},columns:headers.map(name=>({name,filterButton:true})),rows});
  else {sheet.getRow(3).values=headers;sheet.autoFilter='A3:I3';sheet.getCell('A4').value='No matching policies in this category.';}
  const widths=[38,30,25,20,20,24,18,22,24];sheet.columns.forEach((column,i)=>{column.width=widths[i];column.alignment={vertical:'top',wrapText:true};});
  sheet.getColumn(3).numFmt='@';sheet.getColumn(4).numFmt='"£"#,##0.00';sheet.getColumn(5).numFmt='dd mmm yyyy';sheet.getColumn(7).numFmt='0';
  sheet.getRow(3).height=30;
  sheet.getRow(3).eachCell(cell=>{cell.font={name:'Arial',size:10,bold:true,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF102642'}};});
  records.forEach((record,n)=>{
   const row=sheet.getRow(n+4);row.height=Math.max(30,Math.ceil(Math.max(record.supplier.length/34,record.policy.length/26,record.number.length/21))*14+10);row.font={name:'Arial',size:10,color:{argb:'FF102642'}};
   if(record.cover==null)row.getCell(4).value='Not recorded';
   if(record.days<0)row.eachCell(cell=>{cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF5F5'}};cell.font={name:'Arial',size:10,color:{argb:'FFA33A3A'}};});
   [8,9].forEach(i=>{if(row.getCell(i).value?.hyperlink)row.getCell(i).font={name:'Arial',size:10,underline:true,color:{argb:'FF245889'}};});
  });
  sheet.pageSetup.printTitlesRow='1:3';sheet.headerFooter.oddFooter='&LALS Hub | Insurance report&RPage &P of &N';
 }
 return new Uint8Array(await book.xlsx.writeBuffer());
}