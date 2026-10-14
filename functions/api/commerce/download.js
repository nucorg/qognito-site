import { download } from '../../../server/commerce/sales.mjs';
export const onRequest = ({ request, env }) => download(request, env);
