export const money=(n:number,compact=false,currency='USD')=>new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:compact?2:0,notation:compact?'compact':'standard'}).format(n);
export const number=(n:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n);
export const percent=(n:number)=>(n*100).toFixed(1)+'%';
