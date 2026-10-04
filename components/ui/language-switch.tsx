'use client';
import {useEffect} from 'react';
import {useLanguage} from '@/lib/i18n';
export function LanguageSwitch(){const {language,setLanguage}=useLanguage();useEffect(()=>{const saved=localStorage.getItem('development-modeler-language');if(saved==='ru'||saved==='en')setLanguage(saved)},[setLanguage]);return <div className="language-switch" role="group" aria-label="Язык / Language">{(['ru','en'] as const).map(lang=><button key={lang} type="button" lang={lang} aria-label={lang==='ru'?'Русский':'English'} aria-pressed={language===lang} onClick={()=>setLanguage(lang)}>{lang.toUpperCase()}</button>)}</div>}
