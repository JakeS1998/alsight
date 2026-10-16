export function pqPdfTable(doc,state,headers,rows,ratios=[0.39,0.61]) {
 const widths=ratios.map(r=>r*state.contentWidth),pad=7,lineHeight=11.5;
 const font=bold=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(9);};
 const wrap=(values,bold=false)=>{font(bold);return widths.map((w,i)=>doc.splitTextToSize(state.clean(values[i]??''),w-pad*2));};
 const paint=(cells,height,bold=false)=>{
  let x=state.margin;font(bold);
  cells.forEach((lines,index)=>{
   doc.setFillColor(...(bold?[235,238,241]:[255,255,255]));doc.setDrawColor(150,158,167);doc.setLineWidth(0.45);doc.rect(x,state.y,widths[index],height,'FD');doc.setTextColor(16,38,66);
   lines.forEach((line,j)=>{
    const top=state.y+pad+9+j*lineHeight,match=line.match(/^\[([ X])\] /);
    if(match){doc.rect(x+pad,top-7,7,7);if(match[1]==='X'){doc.line(x+pad+1,top-6,x+pad+6,top-1);doc.line(x+pad+6,top-6,x+pad+1,top-1);}doc.text(line.slice(4),x+pad+12,top);}
    else doc.text(line,x+pad,top);
   });x+=widths[index];
  });state.y+=height;
 };
 const heading=()=>{if(headers){const cells=wrap(headers,true);paint(cells,Math.max(...cells.map(c=>c.length))*lineHeight+pad*2,true);}};
 state.room(65);heading();
 for(const values of rows){
  const cells=wrap(values);let offset=0,count=Math.max(1,...cells.map(c=>c.length));
  const full=count*lineHeight+pad*2;
  if(full<=state.bottom-state.top&&state.y+full>state.bottom){state.newPage();heading();}
  while(offset<count){
   if(state.bottom-state.y<lineHeight+pad*2){state.newPage();heading();}
   const take=Math.min(count-offset,Math.floor((state.bottom-state.y-pad*2)/lineHeight));
   paint(cells.map(c=>c.slice(offset,offset+take)),take*lineHeight+pad*2);offset+=take;
   if(offset<count){state.newPage();heading();}
  }
 }
 state.y+=9;
}