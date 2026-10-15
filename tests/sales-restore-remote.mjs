// Read-only comparison of an exported D1 snapshot with an isolated remote restore.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
const dir='.wrangler/sales-recovery/';
const cfg=JSON.parse(await readFile(dir+'restore.json'));
const database=cfg.d1_databases[0];
assert.equal(database.database_name,'qognito-restore-20261014');
assert.equal(database.database_id,'8be94624-f169-4eb6-a294-d665e65b8cdb');
const auth=await readFile(homedir()+'/.config/.wrangler/config/default.toml','utf8');
const token=auth.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];assert.ok(token);
async function query(sql){
 const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfg.account_id}/d1/database/${database.database_id}/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({sql})});
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.success,true);return data.result[0].results;
}
const backup=await readFile(dir+'staging-backup.sql','utf8');
const db=new DatabaseSync(':memory:');db.exec(backup);
const canonical=rows=>JSON.stringify(rows.map(r=>JSON.stringify(Object.fromEntries(Object.entries(r).sort(([a],[b])=>a.localeCompare(b))))).sort());
const digest=s=>createHash('sha256').update(s).digest('hex');
const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all();
const results=[];
for(const {name} of tables){
 assert.match(name,/^[a-zA-Z_][a-zA-Z0-9_]*$/);
 const sql=`SELECT * FROM "${name}"`;
 const local=db.prepare(sql).all();const remote=await query(sql);
 assert.equal(digest(canonical(remote)),digest(canonical(local)),`Snapshot differs: ${name}`);
 results.push({table:name,rows:local.length,sha256:digest(canonical(local))});
}
assert.deepEqual(await query('PRAGMA foreign_key_check'),[]);
assert.equal((await query('PRAGMA quick_check'))[0].quick_check,'ok');
const report={restored_database:database.database_id,backup_sha256:digest(backup),checked_at:new Date().toISOString(),tables:results,foreign_keys:'ok',integrity:'ok'};
await writeFile(dir+'restore-verification.json',JSON.stringify(report,null,2),{mode:0o600});
console.log(report);
