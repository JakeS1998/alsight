export function currentMonthFigures(forecast,recorded){
 const forecastInvoice=forecast.invoice??0,forecastPo=forecast.projects===0?0:forecast.po;
 const total=(actual,estimate)=>actual==null||estimate==null?null:Math.round((actual+estimate)*100)/100;
 return {...forecast,current:true,actualInvoice:recorded.invoice,actualPo:recorded.po,forecastInvoice,forecastPo,invoice:total(recorded.invoice,forecastInvoice),po:total(recorded.po,forecastPo),recorded:recorded.recorded,dueDateFallback:recorded.dueDateFallback};
}