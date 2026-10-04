'use client';
import {create} from 'zustand';
import {ru} from './ru';
export type Language='en'|'ru';
export const useLanguage=create<{language:Language;setLanguage:(language:Language)=>void}>(set=>({language:'ru',setLanguage:language=>{set({language});if(typeof window!=='undefined'){localStorage.setItem('development-modeler-v2-language',language);document.documentElement.lang=language}}}));
export function tr(value:string):string {if(useLanguage.getState().language==='en')return value;const key=value.trim();if(ru[key])return value.replace(key,ru[key]);return value.replace(/^Infrastructure ·/,'Инфраструктура ·').replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (?=\d{2}\b)/g,month=>(ru[month.trim()]||month.trim())+' ').replace(/profit margin/g,'маржа прибыли').replace(/per m²/g,'за м²').replace(/\bMonth (?=\d)/g,'Месяц ').replace(/^Saved locally/,'Сохранено на устройстве').replace(/^Cash flow ·/,'Денежный поток ·');}
