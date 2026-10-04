'use client';
import {useState,useRef,type InputHTMLAttributes,type ChangeEvent} from 'react';
/** Keep a local editing draft so empty / partial numbers never overwrite the model. */
export function NumberInput({value,onChange,onFocus,onBlur,onKeyDown,onMouseUp,...props}:InputHTMLAttributes<HTMLInputElement>){
 const [draft,setDraft]=useState<string|null>(null),selectOnMouseUp=useRef(false);
 return <input {...props} type="number" className={`${props.className||''} ${Number(draft??value)<0?'amount-negative':''}`} value={draft??value??''}
 onFocus={event=>{setDraft(String(value??''));selectOnMouseUp.current=true;event.currentTarget.select();onFocus?.(event)}}
 onMouseUp={event=>{if(selectOnMouseUp.current){event.preventDefault();event.currentTarget.select();selectOnMouseUp.current=false}onMouseUp?.(event)}}
 onChange={event=>{const text=event.currentTarget.value;setDraft(text);if(text.trim()!==''&&Number.isFinite(event.currentTarget.valueAsNumber))onChange?.(event)}}
 onBlur={event=>{const input=event.currentTarget;if(input.value.trim()!==''&&Number.isFinite(input.valueAsNumber)){
 const lower=props.min===undefined?-Infinity:Number(props.min),upper=props.max===undefined?Infinity:Number(props.max);
 const next=Math.max(lower,Math.min(upper,input.valueAsNumber));if(next!==input.valueAsNumber){input.value=String(next);onChange?.(event as unknown as ChangeEvent<HTMLInputElement>)}
 }setDraft(null);selectOnMouseUp.current=false;onBlur?.(event)}}
 onKeyDown={event=>{onKeyDown?.(event);if(event.key==='Enter'&&!event.defaultPrevented){event.preventDefault();event.currentTarget.blur()}}}/>;
}
