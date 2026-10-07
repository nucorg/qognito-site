import { checkout } from '../../../server/commerce/stripe.mjs';
export const onRequest = ({ request, env }) => checkout(request, env);
