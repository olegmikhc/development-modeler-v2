'use client';
import {Children,Fragment,isValidElement,ReactNode,CSSProperties} from 'react';
import {Select} from 'radix-ui';
import {Check,ChevronDown,ChevronUp} from 'lucide-react';
type Option={value:string;label:ReactNode;disabled?:boolean};
function optionsFrom(children:ReactNode):Option[]{return Children.toArray(children).flatMap(child=>{
 if(!isValidElement<{value?:string|number;children?:ReactNode;disabled?:boolean}>(child))return [];
 if(child.type===Fragment)return optionsFrom(child.props.children);
 if(child.type!=='option')return [];
 return [{value:String(child.props.value??''),label:child.props.children,disabled:child.props.disabled}];
})}
const encode=(value:string)=>`option:${value}`;
/** Shared single-choice field; keeps existing value callbacks and accessible keyboard navigation. */
export function AppSelect({children,value,onChange,disabled,required,id,name,className='',style,...aria}:{children:ReactNode;value:string|number;onChange:(event:{target:{value:string}})=>void;disabled?:boolean;required?:boolean;id?:string;name?:string;className?:string;style?:CSSProperties;'aria-label'?:string;'aria-labelledby'?:string;'aria-describedby'?:string}){
 const options=optionsFrom(children),selected=String(value);
 return <Select.Root value={encode(selected)} onValueChange={next=>onChange({target:{value:next.slice(7)}})} disabled={disabled} required={required} name={name}>
  <Select.Trigger id={id} className={`app-select ${className}`} style={style} {...aria}><Select.Value placeholder="Выберите значение"/><Select.Icon className="app-select-icon"><ChevronDown size={16} strokeWidth={1.8}/></Select.Icon></Select.Trigger>
  <Select.Portal><Select.Content className="app-select-menu" position="popper" align="start" sideOffset={6} collisionPadding={12}><Select.ScrollUpButton className="app-select-scroll"><ChevronUp size={16}/></Select.ScrollUpButton><Select.Viewport className="app-select-options">{options.map(option=><Select.Item className="app-select-option" value={encode(option.value)} key={option.value} disabled={option.disabled}><Select.ItemText>{option.label||'Не выбрано'}</Select.ItemText><Select.ItemIndicator className="app-select-check"><Check size={16} strokeWidth={2}/></Select.ItemIndicator></Select.Item>)}</Select.Viewport><Select.ScrollDownButton className="app-select-scroll"><ChevronDown size={16}/></Select.ScrollDownButton></Select.Content></Select.Portal>
 </Select.Root>;
}
