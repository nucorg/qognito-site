import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const whitepaper = {
  title: 'La facture fantôme de l’IA',
  path: '/livres-blancs/la-facture-fantome-ia/',
  pdfPath: '/livres-blancs/la-facture-fantome-ia-v1.pdf',
  version: '1.0',
  noticeVersion: '2026-09-29-v1',
};

// Ces contrôles ont lieu au build. Une clé Web3Forms est publique par conception.
export const accessKey = (import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY || '').trim();
export const collectionEnabled = import.meta.env.PUBLIC_WHITEPAPER_ENABLED === 'true';
const pdf = resolve('public', `.${whitepaper.pdfPath}`);
export const pdfAvailable = existsSync(pdf) && readFileSync(pdf).subarray(0, 5).toString() === '%PDF-';
export const mailProvider = (import.meta.env.PUBLIC_MAIL_PROVIDER || '').trim();
export const mailLocation = (import.meta.env.PUBLIC_MAIL_LOCATION || '').trim();
export const mailSafeguards = (import.meta.env.PUBLIC_MAIL_SAFEGUARDS || '').trim();

if (collectionEnabled && (!accessKey || !pdfAvailable || !mailProvider || !mailLocation || !mailSafeguards)) {
  throw new Error('Livre blanc : clé Web3Forms, PDF final et informations de messagerie requis avant activation. Voir docs/publication-livre-blanc.md.');
}

export const whitepaperPath = (lang: 'fr' | 'en') => `${lang === 'en' ? '/en' : ''}${whitepaper.path}`;
