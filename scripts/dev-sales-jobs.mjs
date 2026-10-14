import {readFile,writeFile} from 'node:fs/promises';import{resolve}from'node:path';import{spawn}from'node:child_process';
const dir=resolve('.wrangler/sales-dev');
const config=JSON.parse(await readFile(resolve(dir,'wrangler.json'),'utf8'));
delete config.pages_build_output_dir;
config.name='qognito-sales-jobs-local';config.main=resolve(dir,'workers/commerce-jobs.mjs');config.triggers={crons:['*/5 * * * *']};
const path=resolve(dir,'jobs.json');await writeFile(path,JSON.stringify(config));
const child=spawn('npx',['wrangler','dev','--config',path,'--test-scheduled','--persist-to',resolve('.wrangler/sales-state'),'--port','8789','--ip','127.0.0.1','--log-level','warn'],{cwd:dir,stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code||0));
