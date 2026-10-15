import { guaranteeText } from './guarantee.mjs';
import catalogue from '../../commerce/saga-volume-01.json' with { type: 'json' };
export const MEDIATOR_CONTACT = 'CM2C (Centre de la Médiation de la Consommation de Conciliateurs de Justice), 49 rue de Ponthieu, 75008 Paris. Site : https://www.cm2c.net/ ; saisine en ligne : https://www.cm2c.net/declarer-un-litige.php ; courriel : declarer-un-litige@cm2c.net';
export const OFFER = Object.freeze({
 id: catalogue.offer_id, edition: catalogue.contents.private_pdf_candidate.edition_id,
 title: 'SAGA-IA — Volume 1 : décision de délégation et viabilité économique',
 amount: catalogue.price.amount_minor, tax: 261, currency: 'eur',
 sha256: catalogue.contents.private_pdf_candidate.sha256,
 version: catalogue.contents.private_pdf_candidate.version,
 sourcePath: catalogue.contents.private_pdf_candidate.source_path,
 pdfKey: `saga-ia/volume-01/fr/${catalogue.contents.private_pdf_candidate.version}/${catalogue.contents.private_pdf_candidate.edition_id}.pdf`,
 filename: `${catalogue.contents.private_pdf_candidate.edition_id}.pdf`, termsVersion: '2026-10-14-v2',
});
export function termsText(env = {}) {
 return `Conditions de vente — ${OFFER.termsVersion}
QOGNITO SASU, capital 1 000 €, 151 Avenue Félix Faure, 92800 Puteaux, France.
RCS Nanterre 130 175 730 — TVA FR07130175730. Contact : contact@qognito.io. Téléphone : ${env.COMMERCE_PHONE || '+33 7 62 64 05 06'}.
Produit : ${OFFER.title}. Édition française ${OFFER.version}, 93 pages couverture comprise, sections 1 et 2, PDF numérique. Prix : 49,99 € TTC, dont TVA à 5,5 % incluse. Paiement unique par carte via Stripe. Vente limitée à la France métropolitaine.
Licence : un lecteur autorisé. Lecture hors ligne, impression, sauvegarde et étude avec un assistant IA privé permises. Redistribution, revente, mise à disposition dans un assistant public ou auprès de lecteurs non licenciés interdites. Les nouvelles éditions, autres langues, coaching et certification ne sont pas inclus.
Compatibilité : lecteur PDF sur ordinateur, tablette ou téléphone. Les exercices sont utilisables avec une calculatrice ou un tableur. Arbitre est un compagnon facultatif gratuit, distribué séparément sous licence MIT ; aucun accès hébergé nominatif n'est vendu.
Livraison : après paiement confirmé, un lien protégé est proposé sur la page de confirmation et envoyé à l'adresse de commande. Le lien est valable sept jours ; sa remise peut être demandée à contact@qognito.io avec la référence de commande. Le PDF téléchargé reste utilisable hors ligne. Une indisponibilité temporaire fait l'objet d'une reprise ; contacter l'assistance en cas de non-réception.
Commande : le client vérifie ses informations et les trois accords avant de poursuivre vers Stripe, où il peut corriger son adresse et son email avant le paiement. Le contrat est confirmé après encaissement ; la confirmation et les conditions acceptées sont envoyées par email. La version contractuelle est conservée avec la référence de commande.
Exécution immédiate : le client demande expressément la fourniture avant la fin du délai de rétractation et reconnaît perdre ce droit dès le commencement de la fourniture. Ces accords sont recueillis séparément avant le paiement et confirmés par email. Sans ces accords, aucune commande immédiate n'est créée.
Garanties : contacter QOGNITO aux coordonnées ci-dessus. Les garanties légales et les mises à jour nécessaires au maintien de la conformité restent applicables, indépendamment des nouvelles éditions commerciales et de l'accord de fourniture immédiate.
Réclamations et remboursements : contact@qognito.io, en indiquant la référence. Un remboursement accepté utilise le moyen de paiement initial ; les accès futurs sont révoqués en cas de remboursement total. Un remboursement ne peut effacer un fichier déjà sauvegardé.
Médiation : après réclamation écrite préalable adressée à Qognito et restée sans solution, le consommateur peut recourir gratuitement au médiateur désigné : ${env.COMMERCE_MEDIATOR || MEDIATOR_CONTACT}.
Données : les informations nécessaires à la commande, à la livraison, aux justificatifs et au traitement des incidents sont traitées par Qognito avec Stripe, Cloudflare et Resend. Les données de carte sont traitées par Stripe. Les pièces comptables sont conservées selon les obligations légales ; les journaux techniques sont limités à leur utilité. Droits et contact : contact@qognito.io ; informations complémentaires : https://qognito.io/confidentialite/.
${guaranteeText}
Droit applicable : droit français, sans privation des protections impératives applicables aux consommateurs. Aucun règlement de différend ne restreint leurs voies de recours légales.`;
}
