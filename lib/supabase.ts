'use client';
import {createClient,SupabaseClient} from '@supabase/supabase-js';
import {FinancialModel} from '@/types/model';
let client:SupabaseClient|null=null;
export function supabase(){if(client)return client;const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)return null;client=createClient(url,key);return client}
export async function syncModel(model:FinancialModel,org:string,revision:number){const sb=supabase();if(!sb)throw Error('Supabase is not configured');const {data:auth,error:authError}=await sb.auth.getUser();if(authError||!auth.user?.email_confirmed_at)throw Error('Sign in with a verified email to save changes.');const {data,error}=await sb.rpc('save_financial_model',{model_uuid:model.id,org_uuid:org,model_name:model.name,payload:model,expected_revision:revision});if(error)throw error;return data as number}
