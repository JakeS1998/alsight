import {jsPDF} from 'npm:jspdf@4.2.1';
import {pqPdfTable} from './pqPdfTable.ts';
export function pqPdfLayout(reference){
 const doc=new jsPDF({unit:'pt',format:'a4'}),margin=34,width=doc.internal.pageSize.getWidth(),height=doc.internal.pageSize.getHeight();
 const clean=value=>String(value??'').replace(/[\u2013\u2014]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/\u2022/g,'-');
 const state={margin,contentWidth:width-margin*2,top:94,bottom:height-43,y:94,clean,newPage:null,room:null};
 const header=()=>{
  doc.setTextColor(16,38,66);doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('UK LEISURE FRAMEWORK',margin,37);
  doc.setFontSize(10);doc.text('PROJECT QUESTIONNAIRE',margin,55);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(clean(reference).slice(0,30),width-margin,55,{align:'right'});
  doc.setDrawColor(245,153,41);doc.setLineWidth(2);doc.line(margin,68,width-margin,68);
 };
 state.newPage=()=>{doc.addPage();header();state.y=state.top;};
 state.room=needed=>{if(state.y+needed>state.bottom)state.newPage();};header();
 const text=(value,{bold=false,size=9}={})=>{
  doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);
  const lines=doc.splitTextToSize(clean(value),state.contentWidth),lineHeight=size*1.35;
  for(const line of lines){state.room(lineHeight);doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(16,38,66);doc.text(line,margin,state.y);state.y+=lineHeight;}
  state.y+=7;
 };
 const section=label=>{
  state.room(95);doc.setFillColor(16,38,66);doc.rect(margin,state.y-3,state.contentWidth,24,'F');
  doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(clean(label),margin+8,state.y+12);state.y+=29;
 };
 const table=(headers,rows,ratios)=>pqPdfTable(doc,state,headers,rows,ratios);
 const field=(label,value)=>table(null,[[label,value||'Not recorded']]);
 const checklist=(label,options,selected)=>{
  state.room(75);text(label,{bold:true});const entries=options.map(option=>`[${selected.includes(option)?'X':' '}] ${option}`),rows=[];
  for(let i=0;i<entries.length;i+=3)rows.push([entries[i]||'',entries[i+1]||'',entries[i+2]||'']);
  table(null,rows,[1/3,1/3,1/3]);
 };
 const finish=()=>{
  const count=doc.getNumberOfPages();
  for(let page=1;page<=count;page++){doc.setPage(page);doc.setDrawColor(150,158,167);doc.setLineWidth(0.4);doc.line(margin,height-34,width-margin,height-34);doc.setTextColor(95,117,134);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('UK Leisure Framework | PQ | ALSight digital export',margin,height-21);doc.text(`${page} / ${count}`,width-margin,height-21,{align:'right'});}
  return new Uint8Array(doc.output('arraybuffer'));
 };
 return {text,section,field,table,checklist,finish};
}