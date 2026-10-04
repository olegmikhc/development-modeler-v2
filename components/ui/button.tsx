'use client';
import {tr,useLanguage} from '@/lib/i18n';
import * as React from 'react';
import {Slot} from 'radix-ui';
import {cva,type VariantProps} from 'class-variance-authority';
import {clsx} from 'clsx';
import {twMerge} from 'tailwind-merge';
const variants=cva('btn',{variants:{variant:{default:'dark',outline:'',destructive:'danger'}},defaultVariants:{variant:'default'}});
export function Button({className,variant,asChild=false,...props}:React.ComponentProps<'button'>&VariantProps<typeof variants>&{asChild?:boolean}){useLanguage();const Comp=asChild?Slot.Root:'button';return <Comp data-slot="button" className={twMerge(clsx(variants({variant}),className))} {...props}/>}
