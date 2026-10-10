export const ACTION_COLS = [
  {key:'action',label:'Action',required:true,fullWidth:true,type:'text'},
  {key:'owner',label:'Owner',type:'action_owner'},
  {key:'due_date',label:'Due',type:'date'},
  {key:'priority',label:'Priority',type:'select',options:[{value:'low',label:'Low'},{value:'medium',label:'Medium'},{value:'high',label:'High'}]},
  {key:'status',label:'Status',type:'select',options:[{value:'open',label:'Open'},{value:'in_progress',label:'In progress'},{value:'done',label:'Done'}]},
  {key:'comments',label:'Comments',type:'textarea',fullWidth:true},
];
export const ACTION_TABLE=['action','owner','due_date','priority','status'];
export const DECISION_COLS = [
  {key:'decision_title',label:'Decision',required:true,fullWidth:true,type:'text'},
  {key:'requested_by',label:'Requested by',type:'text'},
  {key:'date_requested',label:'Date requested',type:'date'},
  {key:'required_by',label:'Required by',type:'date'},
  {key:'decision_maker',label:'Decision maker',type:'text'},
  {key:'decision',label:'Decision',type:'textarea',fullWidth:true},
  {key:'date_agreed',label:'Date agreed',type:'date'},
  {key:'financial_impact',label:'Financial impact notes',type:'text'},
  {key:'financial_adjustment',label:'Contract adjustment (£)',type:'number',step:'0.01',help:'Enter a positive addition, negative omission, or 0 for no cost change. Only Agreed decisions adjust the saved construction contract in Valuations; notes alone do not change totals.'},
  {key:'programme_impact',label:'Programme impact',type:'text'},
  {key:'supporting_document',label:'Supporting document (link)',type:'text',fullWidth:true},
  {key:'status',label:'Status',type:'select',options:[{value:'open',label:'Open'},{value:'agreed',label:'Agreed'}]},
];
export const DECISION_TABLE=['decision_title','requested_by','required_by','date_agreed','financial_adjustment','status'];