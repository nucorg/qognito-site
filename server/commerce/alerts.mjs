// Durable notifications of repeated order-processing failures. The same provider
// sends delivery and alert emails: an independent external monitor is still needed
// to detect a complete Resend/Cloudflare outage while it is happening.
const now = () => Math.floor(Date.now()/1000);
export async function monitorSales(env, send=fetch) {
 if (!env.COMMERCE_ALERT_TO) return;
 if (!['test','live'].includes(env.COMMERCE_MODE) || !env.RESEND_API_KEY || !env.COMMERCE_FROM) throw Error('alert_configuration');
 const q=(sql,...args)=>env.COMMERCE_DB.prepare(sql).bind(...args);
 await q(`INSERT INTO sales_alerts(order_id,opened_at)
 SELECT id,? FROM sales_orders WHERE environment=? AND job_attempts>=5
 AND NOT EXISTS(SELECT 1 FROM sales_alerts WHERE order_id=sales_orders.id AND resolved_at IS NULL)
 ON CONFLICT DO NOTHING`,now(),env.COMMERCE_MODE).run();
 await q(`UPDATE sales_alerts SET resolved_at=? WHERE resolved_at IS NULL AND order_id IN
 (SELECT id FROM sales_orders WHERE environment=? AND job_attempts=0 AND last_error IS NULL)`,now(),env.COMMERCE_MODE).run();
 const {results}=await q(`SELECT a.* FROM sales_alerts a JOIN sales_orders o ON o.id=a.order_id
 WHERE o.environment=? AND a.lease_until<? AND (a.failure_email_id IS NULL OR (a.resolved_at IS NOT NULL AND a.recovery_email_id IS NULL))
 ORDER BY a.id LIMIT 5`,env.COMMERCE_MODE,now()).all();
 for(const alert of results) {
  const locked=await q('UPDATE sales_alerts SET lease_until=? WHERE id=? AND lease_until<? RETURNING id',now()+120,alert.id,now()).first();
  if(!locked)continue;
  try {
   // Send at most one message per incident/pass; recovery follows on the next pass.
   const failure=!alert.failure_email_id;
   const phase=failure?'incident':'reprise';
   const response=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`sales-alert:${env.COMMERCE_MODE}:${alert.order_id}:${alert.id}:${phase}`},body:JSON.stringify({from:env.COMMERCE_FROM,to:[env.COMMERCE_ALERT_TO],reply_to:'contact@qognito.io',subject:`[Qognito ${env.COMMERCE_MODE}] ${failure?'Incident commande':'Reprise commande'} ${alert.order_id.slice(0,8)}`,text:`${failure?'Au moins cinq tentatives de traitement ont échoué. Vérifier la commande, Stripe, Resend et les journaux Cloudflare.':'Le traitement de la commande a repris sans erreur.'}\nRéférence : ${alert.order_id}\nEnvironnement : ${env.COMMERCE_MODE}\nIncident ouvert : ${new Date(alert.opened_at*1000).toISOString()}\n${!failure?'Résolu : '+new Date(alert.resolved_at*1000).toISOString():''}\nGuide : docs/commerce-saga-ia/release/exploitation.md\nAucun nouvel encaissement manuel ne doit être lancé pour rejouer une livraison.`})});
   if(!response.ok)throw Error('alert_provider');
   const result=await response.json();if(!result.id)throw Error('alert_response');
   await q(`UPDATE sales_alerts SET ${failure?'failure_email_id':'recovery_email_id'}=? WHERE id=?`,result.id,alert.id).run();
  } catch {console.error('commerce_alert_pending',JSON.stringify({incident:alert.id,order:alert.order_id}));}
  finally {await q('UPDATE sales_alerts SET lease_until=0 WHERE id=?',alert.id).run();}
 }
}
