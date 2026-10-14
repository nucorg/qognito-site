import { checkout } from '../../../server/commerce/sales.mjs';
export const onRequest = ({ request, env }) => checkout(request, env);
