export async function correctedDocumentLinks(db,entity,records) {
 const ids=records.map(record=>record.id).filter(Boolean);
 if(!ids.length)return records;
 const page=await db.DocumentLinkCorrection.filter({entity,record_id:{$in:ids}},{limit:200,sort:'-updated_date'});
 if(page.has_more)throw new Error('Too many link corrections; resolve duplicate corrections first.');
 const byId=new Map();for(const row of page.items)if(!byId.has(row.record_id))byId.set(row.record_id,row);
 return records.map(record=>{const correction=byId.get(record.id);return correction?{...record,link_to_file:correction.url,local_link:true,link_version:correction.updated_date}:record;});
}