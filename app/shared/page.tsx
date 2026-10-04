'use client';
import {Suspense} from 'react';
import {useSearchParams} from 'next/navigation';
import {SharedModel} from '@/features/models/shared-model';
function Content(){return <SharedModel token={useSearchParams().get('token')||''}/>;}
export default function Shared(){return <Suspense fallback={<p>Loading…</p>}><Content/></Suspense>;}
