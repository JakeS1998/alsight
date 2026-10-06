export function dataRequestError(error,fallback,defaultStatus=500) {
 const message=String(error?.response?.data?.error || error?.message || fallback).slice(0,1000);
 const limited=/rate limit|too many requests/i.test(message);
 const supplied=Number(error?.response?.status || error?.status);
 const status=limited ? 429 : supplied>=400 && supplied<=599 ? supplied : defaultStatus;
 return Response.json({error:message},{status,...(limited ? {headers:{'Retry-After':'60'}} : {})});
}