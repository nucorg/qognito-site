import { orderStatus } from '../../../server/commerce/sales.mjs';
export const onRequest = ({ request, env }) => orderStatus(request, env);
