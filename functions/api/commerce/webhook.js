import { webhook } from '../../../server/commerce/stripe.mjs';
export const onRequest = ({ request, env }) => webhook(request, env);
