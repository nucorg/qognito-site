import { runJobs } from '../server/commerce/sales.mjs';
import { monitorSales } from '../server/commerce/alerts.mjs';
export async function scheduledSales(env) {
 try { await runJobs(env); }
 finally { await monitorSales(env); }
}
export default { async scheduled(controller, env, ctx) { ctx.waitUntil(scheduledSales(env)); } };
