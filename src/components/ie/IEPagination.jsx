import React from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
export default function IEPagination({page,size,count,total,hasMore,loading,onPrevious,onNext}){
 const start=count?page*size+1:0,end=page*size+count;
 return <footer className="ie-pagination"><span>Showing <strong>{start}–{end}</strong>{total!=null?` of ${total} engagements`:' engagements'}</span><nav aria-label="Engagement pages"><button type="button" disabled={!page||loading} onClick={onPrevious} aria-label="Previous page"><ChevronLeft/></button><span className="ie-current-page" aria-current="page">{page+1}</span><span className="ie-page-total">{total!=null?`of ${Math.max(1,Math.ceil(total/size))}`:''}</span><button type="button" disabled={!hasMore||loading} onClick={onNext} aria-label="Next page"><ChevronRight/></button></nav></footer>;
}