'use client';
import {tr,useLanguage} from '@/lib/i18n';
import {Dialog as Primitive} from 'radix-ui';
import {X} from 'lucide-react';
export function Dialog({open,onOpenChange,title,children,wide=false}:{open:boolean;onOpenChange:(v:boolean)=>void;title:string;children:React.ReactNode;wide?:boolean}){useLanguage();return <Primitive.Root open={open} onOpenChange={onOpenChange}><Primitive.Portal><Primitive.Overlay className="modal-overlay"/><Primitive.Content className={`modal ${wide?'wide':''}`} aria-describedby={undefined}><header><Primitive.Title>{tr(title)}</Primitive.Title><Primitive.Close className="icon-btn" aria-label={tr("Close")}><X size={18}/></Primitive.Close></header>{children}</Primitive.Content></Primitive.Portal></Primitive.Root>}
