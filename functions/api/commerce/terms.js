import { terms } from '../../../server/commerce/sales.mjs';
export const onRequest = ({ request, env }) => terms(request, env);
