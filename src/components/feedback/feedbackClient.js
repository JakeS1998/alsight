import {base44} from '@/api/base44Client';
export const feedbackCategories=['Easy to use','Contains useful information','Difficult to navigate','Missing information or functionality','Something isn’t working'];
export async function feedbackCall(input) {
 const {data}=await base44.functions.invoke('managePageFeedback',input);
 if(data.error)throw new Error(data.error);
 return data;
}
export function feedbackFilters(filters) {
 const result={page:filters.page,rating:filters.rating,category:filters.category,user:filters.user};
 if(filters.from)result.from=new Date(`${filters.from}T00:00:00`).toISOString();
 if(filters.to){const end=new Date(`${filters.to}T00:00:00`);end.setDate(end.getDate()+1);result.to=end.toISOString();}
 return result;
}