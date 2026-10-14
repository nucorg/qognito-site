import { runJobs } from '../server/commerce/sales.mjs';
export default { async scheduled(controller, env, ctx) { ctx.waitUntil(runJobs(env)); } };
