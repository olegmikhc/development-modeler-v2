'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
export function useVerifiedEditor(){
 const [verified,setVerified]=useState<boolean|null>(null);
 useEffect(()=>{const sb=supabase();if(!sb){setVerified(false);return}let cancelled=false;let request=0;
 const check=async()=>{const current=++request;try{const {data,error}=await sb.auth.getUser();if(!cancelled&&current===request)setVerified(!error&&!!data.user?.email_confirmed_at)}catch{if(!cancelled&&current===request)setVerified(false)}};
 void check();const {data}=sb.auth.onAuthStateChange(()=>{setVerified(null);setTimeout(check,0)});
 return()=>{cancelled=true;data.subscription.unsubscribe()};
 },[]);return verified;
}
