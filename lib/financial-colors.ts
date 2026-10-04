export const financialColors={positive:'#2e6951',negative:'#ad4b3d',funding:'#956416',neutral:'#717773'};
export function amountTone(value:number,kind:'balance'|'expense'|'funding'='balance'){return value===0?'amount-neutral':value<0||kind==='expense'?'amount-negative':kind==='funding'?'amount-funding':'amount-positive'}
