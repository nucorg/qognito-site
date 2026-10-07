import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathForRoute, type SiteLocale } from './locales';

export const whitepaper = {
  title: 'La facture fantôme de l’IA',
  path: '/livres-blancs/la-facture-fantome-ia/',
  editions: {
    fr: { pdfPath: '/livres-blancs/la-facture-fantome-ia-v2.pdf', version: '2.0' },
    en: { pdfPath: '/livres-blancs/the-ai-costs-you-dont-see-en-v3.pdf', version: '3.0' },
    es: { pdfPath: '/livres-blancs/la-factura-fantasma-ia-v2.pdf', version: '2.0' },
  },
  noticeVersion: '2026-09-29-v1',
};

// Ces contrôles ont lieu au build. Une clé Web3Forms est publique par conception.
export const accessKey = (import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY || '').trim();
export const collectionEnabled = import.meta.env.PUBLIC_WHITEPAPER_ENABLED === 'true';
const missingPdfs = Object.values(whitepaper.editions).filter(({ pdfPath }) => {
  const pdf = resolve('public', `.${pdfPath}`);
  return !existsSync(pdf) || readFileSync(pdf).subarray(0, 5).toString() !== '%PDF-';
});
export const pdfAvailable = missingPdfs.length === 0;
export const mailProvider = (import.meta.env.PUBLIC_MAIL_PROVIDER || '').trim();
export const mailLocation = (import.meta.env.PUBLIC_MAIL_LOCATION || '').trim();
export const mailSafeguards = (import.meta.env.PUBLIC_MAIL_SAFEGUARDS || '').trim();

if (collectionEnabled && (!accessKey || !pdfAvailable || !mailProvider || !mailLocation || !mailSafeguards)) {
  throw new Error(`Livre blanc : clé Web3Forms, PDF finaux FR/EN/ES et informations de messagerie requis avant activation.${missingPdfs.length ? ` PDF absents ou invalides : ${missingPdfs.map(({ pdfPath }) => pdfPath).join(', ')}.` : ''} Voir docs/publication-livre-blanc.md.`);
}

export const whitepaperPath = (lang: SiteLocale) => `${pathForRoute('whitepaper', lang)}/`;
