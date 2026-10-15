// Disposable remote fault-injection fixture. Never imported by Pages or production jobs.
import { checkout, webhook, download, runJobs, orderById, downloadLink, json } from '../../server/commerce/sales.mjs';
import { monitorSales } from '../../server/commerce/alerts.mjs';
export default {
 async fetch(request, env) {
  if (env.COMMERCE_MODE !== 'test' || !env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ||
      !env.COMMERCE_ORIGIN.startsWith('https://qognito-recovery-') || !env.RECOVERY_ADMIN) return new Response(null, {status:503});
  const path = new URL(request.url).pathname;
  if (path === '/api/commerce/download') return download(request,env);
  // End-of-test mode preserves the owner's emailed PDF links, closes all controls.
  if (env.RECOVERY_CLOSED === 'true') return new Response(null,{status:410});
  if (path === '/api/commerce/webhook') {
   const fault = await env.COMMERCE_DB.prepare("SELECT enabled FROM recovery_faults WHERE name='webhook'").first();
   return fault?.enabled ? json({error:'injected_outage'},503) : webhook(request,env);
  }
  if (request.headers.get('Authorization') !== `Bearer ${env.RECOVERY_ADMIN}`) return new Response(null,{status:401});
  if (path === '/checkout') return checkout(request,env);
  if (path === '/sql' && request.method === 'POST') {
   const {sql,params=[]}=await request.json();
   return json(await env.COMMERCE_DB.prepare(sql).bind(...params).all());
  }
  if (path === '/jobs' && request.method === 'POST') {
   const fault=await env.COMMERCE_DB.prepare("SELECT enabled FROM recovery_faults WHERE name='email'").first();
   await runJobs(env,null,fault?.enabled ? async()=>new Response('',{status:503}) : fetch);
   return json({done:true});
  }
  if (path === '/alerts' && request.method === 'POST') {
   const {outage=false}=await request.json();
   await monitorSales(env,outage ? async()=>new Response('',{status:503}) : fetch);
   return json({done:true});
  }
  if (path === '/link') {
   const order=await orderById(env,new URL(request.url).searchParams.get('id'));
   return json({url:await downloadLink(env,order)});
  }
  return new Response(null,{status:404});
 }
};
