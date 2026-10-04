'use client';
import {use} from 'react';
import {SharedModel} from '@/features/models/shared-model';
export default function Shared({params}:{params:Promise<{token:string}>}){return <SharedModel token={use(params).token}/>;}
