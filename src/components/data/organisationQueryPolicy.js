const organisationQueryPolicy={
 retry:(attempt,error)=>{
  const status=Number(error?.response?.status || error?.status);
  const message=String(error?.response?.data?.error || error?.message || '');
  if(status===429 || /rate limit|too many requests/i.test(message))return false;
  return attempt<1 && (!status || status>=500);
 },
 retryDelay:1000,
 retryOnMount:false,
 refetchOnWindowFocus:false,
};
export default organisationQueryPolicy;