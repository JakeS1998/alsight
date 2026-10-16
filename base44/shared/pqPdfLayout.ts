import {jsPDF} from 'npm:jspdf@4.2.1';
export function pqPdfLayout(reference){
 const doc=new jsPDF({unit:'pt',format:'a4'}),margin=40,width=doc.internal.pageSize.getWidth(),height=doc.internal.pageSize.getHeight();let y=82;
 const clean=value=>String(value??'').replace(/[\u2013\u2014]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/\u2022/g,'-');
 const header=()=>{doc.setFillColor(16,38,66);doc.rect(0,0,width,58,'F');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text('ALSight | Project Questionnaire',margin,26);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(clean(reference).slice(0,95),margin,44);doc.setTextColor(16,38,66);};
 header();
 const room=needed=>{if(y+needed>height-45){doc.addPage();header();y=82;}};
 const text=(value,{bold=false,size=10}={})=>{
  doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);
  const lines=doc.splitTextToSize(clean(value),width-margin*2),lineHeight=size*1.4;
  for(const line of lines){room(lineHeight);doc.text(line,margin,y);y+=lineHeight;}
  y+=6;
 };
 const section=label=>{room(65);doc.setFillColor(234,244,251);doc.rect(margin-8,y-15,width-margin*2+16,27,'F');text(label,{bold:true,size:12});y+=5;};
 const field=(label,value)=>{room(48);text(label,{bold:true});text(value||'Not recorded');y+=4;};
 const finish=()=>{
  const count=doc.getNumberOfPages();
  for(let page=1;page<=count;page++){doc.setPage(page);doc.setTextColor(95,117,134);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(`ALSight | ${page} / ${count}`,margin,height-22);}
  return new Uint8Array(doc.output('arraybuffer'));
 };
 return {text,section,field,finish};
}