import { OFFER } from './offer.mjs';

// Identité déjà confirmée par Boris, alignée sur THEME_QOGNITO.md et les CGV.
// FR only: the offer currently sells only the French edition in metropolitan France.
export const SELLER = Object.freeze({
 name: 'QOGNITO', legalForm: 'SASU', capital: '1 000 €',
 siren: '130175730', siret: '13017573000014', vat: 'FR07130175730',
 address: { line1: '151 Avenue Félix Faure', postal_code: '92800', city: 'Puteaux', country: 'FR' },
 email: 'contact@qognito.io', phone: '+33762640506',
});
export const INVOICE_FOOTER = 'QOGNITO, SASU au capital de 1 000 € — 151 Avenue Félix Faure, 92800 Puteaux, France. '
 + 'RCS Nanterre 130 175 730 — SIRET 130 175 730 00014 — TVA FR07130175730. '
 + 'Contact : contact@qognito.io — +33 7 62 64 05 06. '
 + 'Paiement comptant par carte avant livraison. Licence individuelle du PDF ; conditions de vente acceptées lors de la commande.';

export function invoiceFields(order) {
 const paidAt = new Date(order.paid_at * 1000);
 if (!order.paid_at || Number.isNaN(paidAt.valueOf())) throw Error('invoice_payment_date');
 const date = new Intl.DateTimeFormat('fr-FR', {timeZone:'Europe/Paris',dateStyle:'short'}).format(paidAt);
 return {
  description: `${OFFER.title}\nPDF français — édition ${order.edition_id}. Paiement encaissé le ${date}.`,
  footer: INVOICE_FOOTER,
  custom_fields: [{name:'Référence commande',value:order.id},{name:'Date de vente / paiement',value:date}],
  rendering: {amount_tax_display:'exclude_tax'},
 };
}
