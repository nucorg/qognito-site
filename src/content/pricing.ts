import catalogue from '../../commerce/saga-volume-01.json';

export const volumePrice = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: catalogue.price.currency,
}).format(catalogue.price.amount_minor / 100);

export const priceLabels = {
  fr: { free: 'Gratuit' },
  en: { free: 'Free' },
  es: { free: 'Gratis' },
} as const;

export const frenchPriceDetail = 'TTC · paiement unique';
export const frenchEditionLabel = 'Édition française';
