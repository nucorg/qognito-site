import { availability } from '../../../server/commerce/sales.mjs';
export const onRequest = ({ request, env }) => availability(request, env);
