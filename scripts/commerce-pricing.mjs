import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const number = (value, name, max = Infinity) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) {
    throw new Error(`${name}: nombre explicite positif ou nul requis (maximum ${max}).`);
  }
  return value;
};
const money = value => Math.round(value * 100) / 100;

// Outil de simulation interne : aucun export de flux marchand ni écriture de prix.
export function calculatePricing(input) {
  const fixed = number(input.fixed_cost_eur, 'fixed_cost_eur');
  const sales = number(input.expected_sales, 'expected_sales');
  if (!Number.isSafeInteger(sales) || sales === 0) throw new Error('expected_sales: entier strictement positif et représentable exactement requis.');
  const variable = number(input.variable_cost_per_buyer_eur, 'variable_cost_per_buyer_eur');
  const annual = input.arbitre?.annual_cost_per_buyer_eur;
  if (!Array.isArray(annual) || annual.length === 0) throw new Error('Arbitre: au moins une année de coût explicite requise.');
  const arbitre = annual.reduce((total, cost, index) => total + number(cost, `arbitre.année_${index + 1}`), 0)
    + number(input.arbitre.tail_reserve_per_buyer_eur, 'arbitre.tail_reserve_per_buyer_eur');
  const feeRate = number(input.fee_rate_of_gross, 'fee_rate_of_gross', 1);
  const feeFixed = number(input.fee_fixed_eur, 'fee_fixed_eur');
  const margin = number(input.target_margin_rate_of_net, 'target_margin_rate_of_net', 1);
  const taxes = input.tax_components;
  if (!Array.isArray(taxes) || taxes.length === 0) throw new Error('tax_components: scénario fiscal explicite requis.');
  const share = taxes.reduce((total, tax, index) => total + number(tax.share_of_gross, `tax_${index}.share_of_gross`, 1), 0);
  if (Math.abs(share - 1) > 1e-9) throw new Error('Les parts TTC des composantes fiscales doivent totaliser 1.');
  const netFactor = taxes.reduce((total, tax, index) => total + tax.share_of_gross / (1 + number(tax.vat_rate, `tax_${index}.vat_rate`, 1)), 0);
  const marginalCost = variable + arbitre + feeFixed;
  const fullCost = marginalCost + fixed / sales;
  const denominator = netFactor * (1 - margin) - feeRate;
  if (denominator <= 0) throw new Error('Objectif de marge impossible avec ces taxes et frais.');
  if (!Array.isArray(input.candidate_prices_gross_eur) || input.candidate_prices_gross_eur.length === 0) {
    throw new Error('candidate_prices_gross_eur: au moins une hypothèse explicite requise.');
  }
  const scenarios = input.candidate_prices_gross_eur.map((candidate, index) => {
    const gross = number(candidate, `candidate_${index}`);
    if (gross === 0) throw new Error('Une hypothèse de prix doit être strictement positive.');
    const net = gross * netFactor;
    const contribution = net - gross * feeRate - marginalCost;
    const profit = contribution - fixed / sales;
    return {
      gross_eur: gross, net_revenue_eur: money(net), fees_eur: money(gross * feeRate + feeFixed),
      contribution_after_arbitre_reserve_eur: money(contribution),
      profit_after_fixed_allocation_eur: money(profit), margin_rate_of_net: profit / net,
      meets_target: profit / net + 1e-12 >= margin,
      break_even_sales: contribution > 0 ? Math.ceil(fixed / contribution) : null
    };
  });
  return {
    status: 'simulation_only_not_an_approved_price',
    arbitre_cost_horizon_years: annual.length,
    arbitre_reserve_per_buyer_eur: money(arbitre),
    allocated_fixed_cost_per_buyer_eur: money(fixed / sales),
    minimum_gross_for_target_eur: Math.ceil((fullCost / denominator - 1e-10) * 100) / 100,
    scenarios
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/commerce-pricing.mjs /chemin/scenario.json');
    const input = JSON.parse(await readFile(process.argv[2], 'utf8'));
    console.log(JSON.stringify(calculatePricing(input), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
