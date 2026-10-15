// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Match the directory URLs served by Cloudflare Pages.
  trailingSlash: 'always',
  // Preserve Astro 6 whitespace handling between inline elements.
  compressHTML: true,
  redirects: {
    '/expertise': { destination: '/parcours/', status: 301 },
    '/en/expertise': { destination: '/en/parcours/', status: 301 },
    '/faq': { destination: '/formations/', status: 301 },
    '/en/faq': { destination: '/en/formations/', status: 301 },
    '/es/expertise': { destination: '/es/parcours/', status: 301 },
    '/es/faq': { destination: '/es/formations/', status: 301 },
  },
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
});
