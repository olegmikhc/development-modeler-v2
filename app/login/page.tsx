'use client';
import {appPath,staticHosting} from '@/lib/app-path';
import {tr,useLanguage} from '@/lib/i18n';
import {useState} from 'react';
import {CloudSettings} from '@/features/models/cloud';
export default function Login(){useLanguage();const [message,setMessage]=useState('');return <main style={{maxWidth:580,margin:'70px auto',width:'90%'}}><h1 style={{marginBottom:28}}>{tr("Development Modeler")}</h1><CloudSettings notify={setMessage}/>{message&&<p role="status" className="notice">{message}</p>}<a className="btn" style={{marginTop:20}} href={appPath('/')}>{tr("Open financial models")}</a><a className="btn" style={{marginTop:20,marginLeft:8}} href={appPath('/invited/')}>{tr('Models shared with me')}</a></main>}
