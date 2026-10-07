import { testPage } from '../server/commerce/test-page.mjs';
export const onRequestGet = ({ request, env }) => testPage(request, env);
