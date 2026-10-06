const organisationQueryPolicy={
 retry:(attempt,error)=>attempt<1 && (Number(error?.response?.status || error?.status)===429 || /rate limit|too many requests/i.test(error?.response?.data?.error || error?.message || '')),
 retryDelay:60000,
 retryOnMount:false,
 refetchOnWindowFocus:false,
};
export default organisationQueryPolicy;