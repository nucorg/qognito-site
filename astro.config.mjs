// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  redirects: {
    '/expertise': { destination: '/parcours/', status: 301 },
    '/en/expertise': { destination: '/en/parcours/', status: 301 },
  },
  build: {
    inlineStylesheets: 'always',
  },
});
