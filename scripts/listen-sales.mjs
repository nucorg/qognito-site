import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
if(!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'))throw new Error('Sandbox key required');
const child=spawn('stripe',['listen','--events','checkout.session.completed,checkout.session.expired,payment_intent.succeeded,payment_intent.amount_capturable_updated,payment_intent.canceled,charge.refunded,charge.dispute.created,charge.dispute.closed,refund.updated,refund.failed,invoice.paid','--forward-to','http://localhost:8788/api/commerce/webhook'],{env:{...process.env,STRIPE_API_KEY:process.env.STRIPE_SECRET_KEY},stdio:['ignore','pipe','pipe']});
let buffer='',ready=false;
function output(chunk){buffer+=chunk.toString();let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);const secret=line.match(/whsec_[A-Za-z0-9]+/)?.[0];if(secret&&!ready){ready=true;readFile('.dev.vars.sales','utf8').then(text=>writeFile('.dev.vars.sales',text.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m,`STRIPE_WEBHOOK_SECRET=${JSON.stringify(secret)}`),{mode:0o600})).then(()=>console.log('Écoute sandbox prête ; secret enregistré en privé. Démarrer dev-sales ensuite.'));}else if(!secret&&/checkout.session|payment_intent|charge.refunded|invoice.paid|ERROR|Error/.test(line))console.log(line.replace(/(?:sk|rk|whsec)_[A-Za-z0-9_]+/g,'[redacted]'));}}
child.stdout.on('data',output);child.stderr.on('data',output);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code||0));
