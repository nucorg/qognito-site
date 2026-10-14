import { webhook } from '../../../server/commerce/sales.mjs';
export const onRequest = ({ request, env }) => webhook(request, env);
