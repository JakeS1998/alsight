import { jsPDF } from 'npm:jspdf@4.2.1';
import { lookoutLogo } from './lookoutDates.ts';
const NAVY=[21,19,90], ORANGE=[247,148,29], GREY=[217,217,220], MID=[181,184,192], WHITE=[255,255,255];
export async function makeLookoutPdf(issue, draft = false) {
  const doc = new jsPDF({unit:'pt',format:'a4'}), W=595.28, H=841.89, M=36, CW=W-2*M;
  const response = await fetch(lookoutLogo,{signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error('Unable to load the ALSight logo.');
  const logo = new Uint8Array(await response.arrayBuffer());
  let y=0;
  const text = value => String(value ?? '').replace(/[\u2013\u2014]/g,'-').replace(/\u2022/g,'-');
  const header = () => {
    doc.setFillColor(...WHITE); doc.rect(0,0,W,H,'F'); doc.addImage(logo,'PNG',M,25,116,40,undefined,'FAST');
    doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text(`ISSUE ${String(issue.issue_number).padStart(3,'0')}  |  ${issue.publication_date}`,W-M,45,{align:'right'});
    doc.setFontSize(33); doc.text('THE LOOKOUT',M,101); doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.text('Projects, People & Information Connected',M,120); doc.text('Your weekly view across Alliance.',M,137);
    doc.setDrawColor(...ORANGE); doc.setLineWidth(3); doc.line(M,153,W-M,153); y=175;
  };
  const ensure = height => { if(y+height>H-50) { doc.addPage(); header(); } };
  const title = (n,label) => {ensure(38); doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...NAVY); doc.setFillColor(...ORANGE); doc.roundedRect(M,y-11,22,18,3,3,'F'); doc.text(String(n),M+11,y+1,{align:'center'}); doc.text(label,M+32,y+1); y+=24;};
  const card = (heading,body,orange=false) => {
    doc.setFont('helvetica','normal'); doc.setFontSize(9); const rows=doc.splitTextToSize(text(body || 'No update submitted.'),CW-28), segments=[];
    for(let i=0;i<rows.length;i+=38) segments.push(rows.slice(i,i+38));
    segments.forEach((segment,index)=>{doc.setFont('helvetica','bold');doc.setFontSize(10);const headingLines=doc.splitTextToSize(text(heading)+(index?' (continued)':''),CW-28),bodyY=23+headingLines.length*12,height=bodyY+segment.length*12+8;ensure(height+8);doc.setDrawColor(...(orange?ORANGE:GREY));doc.setLineWidth(orange?1.5:.6);doc.setFillColor(...WHITE);doc.roundedRect(M,y,CW,height,6,6,'FD');if(orange){doc.setFillColor(...ORANGE);doc.rect(M,y+6,4,height-12,'F');}doc.setTextColor(...NAVY);doc.text(headingLines,M+14,y+17,{lineHeightFactor:1.2});doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(segment,M+14,y+bodyY,{lineHeightFactor:1.33});y+=height+9;});
  };
  header(); const c=issue.content;
  title(1,'EXECUTIVE SNAPSHOT'); const width=(CW-18)/4;
  c.kpis.forEach((k,i)=>{const x=M+i*(width+6);doc.setFillColor(...WHITE);doc.setDrawColor(...GREY);doc.roundedRect(x,y,width,77,5,5,'FD');doc.setFont('helvetica','bold');doc.setFontSize(25);doc.setTextColor(...NAVY);doc.text(String(k.value),x+10,y+33);doc.setFontSize(8);doc.text(doc.splitTextToSize(k.label,width-20),x+10,y+51);});y+=89;
  card('Key Business Announcement',c.announcement); card('Data window',c.reporting_window);
  title(2,'ACTION REQUIRED');card('Priorities, deadlines, training & policy',c.actions.length?c.actions.join('\n'):'No mandatory actions submitted for this issue.',true);
  title(3,'DEPARTMENT ROUND-UP'); c.departments.forEach(d=>card(d.name,`${d.summary || 'No update submitted.'}\nImpact: ${d.impact || 'Not submitted.'}\nRequired action: ${d.action || 'None submitted.'}`));
  title(4,'LOOKING AHEAD · NEXT 14 DAYS');card('Events, deadlines, training & social activities',c.events.length?c.events.map(e=>`${e.date} | ${e.type} | ${e.title}`).join('\n'):'No upcoming entries recorded or submitted.');
  title(5,'PEOPLE & CULTURE');card('New starters, moves, anniversaries & recognition',c.people.length?c.people.join('\n'):'No people updates submitted or recognition recorded.');
  title(6,'VALUES IN ACTION');card('Alliance values in real work',c.values || 'No values-in-action example submitted.');
  title(7,"WHAT'S NEW IN ALSIGHT");
  const col=(CW-12)/2, left=doc.splitTextToSize(text(c.released.join('\n')||'No releases submitted.'),col-24),right=doc.splitTextToSize(text(c.coming_soon.join('\n')||'No roadmap updates submitted.'),col-24);
  for(let i=0;i<Math.max(left.length,right.length);i+=30){const l=left.slice(i,i+30),r=right.slice(i,i+30),h=40+Math.max(l.length,r.length)*12;ensure(h+12);[l,r].forEach((rows,index)=>{const x=M+index*(col+12);doc.setDrawColor(...GREY);doc.roundedRect(x,y,col,h,5,5);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(index?'Coming soon':'Released this week',x+12,y+18);doc.setFont('helvetica','normal');doc.setFontSize(9);if(rows.length)doc.text(rows,x+12,y+35,{lineHeightFactor:1.33});});y+=h+12;}
  title(8,'QUICK POLL');card(c.poll.question,c.poll.options.map((o,i)=>`${i+1}. ${o}`).join('\n')+'\nVote inside ALSight: https://alsight.base44.app/lookout/'+issue.id);
  doc.link(M,y-70,CW,60,{url:'https://alsight.base44.app/lookout/'+issue.id});card('About this issue',c.notes);
  const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor(...GREY);doc.line(M,H-35,W-M,H-35);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...NAVY);doc.text('Projects | People | Information Connected',M,H-20);doc.text(`${draft?'DRAFT · ADMIN REVIEW  |  ':''}${i} / ${pages}`,W-M,H-20,{align:'right'});}
  return new Uint8Array(doc.output('arraybuffer'));
}