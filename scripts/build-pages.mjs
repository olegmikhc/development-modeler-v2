import {cp,mkdtemp,rm,symlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,basename} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),stage=await mkdtemp(join(tmpdir(),'modeler-pages-'));
try{
 await cp(root,stage,{recursive:true,filter:p=>!['node_modules','.next','.git','out','artifacts','.env.local','.env'].includes(basename(p))});
 await symlink(join(root,'node_modules'),join(stage,'node_modules'),'dir');
 await rm(join(stage,'app/api'),{recursive:true,force:true});
 await rm(join(stage,'app/shared/[token]'),{recursive:true,force:true});
 const result=spawnSync(process.execPath,[join(root,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:stage,stdio:'inherit',env:{...process.env,NEXT_PUBLIC_STATIC_HOSTING:'true',NEXT_PUBLIC_BASE_PATH:process.env.NEXT_PUBLIC_BASE_PATH||''}});
 if(result.status!==0)throw Error('Static build failed');
 await rm(join(root,'out'),{recursive:true,force:true});await cp(join(stage,'out'),join(root,'out'),{recursive:true});await writeFile(join(root,'out/.nojekyll'),'');
}finally{await rm(stage,{recursive:true,force:true})}
