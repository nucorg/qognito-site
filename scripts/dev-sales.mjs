// Isolated local runtime; never overwrites .dev.vars or binds a remote resource.
import { mkdir, symlink, writeFile, readFile, lstat, unlink, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { OFFER } from '../server/commerce/offer.mjs';
const root=resolve('.'), dir=resolve('.wrangler/sales-dev'), persist=resolve('.wrangler/sales-state');
await mkdir(dir,{recursive:true,mode:0o700});
await writeFile(resolve(dir,'package.json'),JSON.stringify({name:'qognito-sales-local',type:'module',private:true}));
for(const name of ['functions','server','commerce','dist','workers']) {
 const target=resolve(dir,name);
 try { if((await lstat(target)).isSymbolicLink()) await unlink(target); } catch(e) { if(e.code!=='ENOENT')throw e; }
 await cp(resolve(name),target,{recursive:true});
}
try{await symlink(resolve('node_modules'),resolve(dir,'node_modules'),'dir');}catch(e){if(e.code!=='EEXIST')throw e;}
await writeFile(resolve(dir,'.dev.vars'),await readFile('.dev.vars.sales'),{mode:0o600});
const config={name:'qognito-sales-local',pages_build_output_dir:'./dist',compatibility_date:'2026-10-06',compatibility_flags:['nodejs_compat'],
 d1_databases:[{binding:'COMMERCE_DB',database_name:'qognito-sales-local',database_id:'00000000-0000-0000-0000-000000000000',migrations_dir:resolve('migrations')}],
 r2_buckets:[{binding:'COMMERCE_PDF',bucket_name:'qognito-sales-local'}]};
await writeFile(resolve(dir,'wrangler.json'),JSON.stringify(config));
const run=args=>{const p=spawnSync('npx',['wrangler',...args],{cwd:root,stdio:'inherit'});if(p.status!==0)process.exit(p.status||1);};
if(process.argv.includes('--init')){
 run(['d1','migrations','apply','qognito-sales-local','--local','--config',resolve(dir,'wrangler.json'),'--persist-to',persist]);
 run(['r2','object','put',`qognito-sales-local/${OFFER.pdfKey}`,'--file',resolve(OFFER.sourcePath),'--local','--persist-to',persist,'--content-type','application/pdf']);
 process.exit(0);
}
const child=spawn('npx',['wrangler','pages','dev','dist','--cwd',dir,'--env-file',resolve('.dev.vars.sales'),'--persist-to',persist,'--port','8788','--ip','127.0.0.1','--log-level','warn'],{cwd:dir,stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code||0));
