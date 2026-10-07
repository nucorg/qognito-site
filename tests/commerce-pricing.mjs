import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculatePricing } from '../scripts/commerce-pricing.mjs';

// Valeurs fictives de validation arithmétique, sans recommandation de prix.
const sample = {
  fixed_cost_eur: 1000, expected_sales: 100, variable_cost_per_buyer_eur: 2,
  arbitre: { annual_cost_per_buyer_eur: [3, 3], tail_reserve_per_buyer_eur: 2 },
  fee_rate_of_gross: 0.02, fee_fixed_eur: 1,
  tax_components: [{ share_of_gross: 1, vat_rate: 0.2 }],
  target_margin_rate_of_net: 0.3, candidate_prices_gross_eur: [30, 60]
};
const result = calculatePricing(sample);
assert.equal(result.arbitre_reserve_per_buyer_eur, 8);
assert.equal(result.minimum_gross_for_target_eur, 37.28);
assert.equal(result.scenarios[0].contribution_after_arbitre_reserve_eur, 13.4);
assert.equal(result.scenarios[0].profit_after_fixed_allocation_eur, 3.4);
assert.equal(result.scenarios[0].break_even_sales, 75);
assert.equal(result.scenarios[0].meets_target, false);
assert.equal(result.scenarios[1].meets_target, true);
const split = calculatePricing({ ...sample, tax_components: [
  { share_of_gross: 0.5, vat_rate: 0.055 }, { share_of_gross: 0.5, vat_rate: 0.2 }
] });
assert.equal(split.scenarios[0].net_revenue_eur, 26.72);
assert.ok(split.minimum_gross_for_target_eur < result.minimum_gross_for_target_eur);
assert.equal(calculatePricing({ ...sample, candidate_prices_gross_eur: [1] }).scenarios[0].break_even_sales, null);
for (const overrides of [
  { expected_sales: 0 }, { expected_sales: 1.5 }, { variable_cost_per_buyer_eur: null },
  { arbitre: { annual_cost_per_buyer_eur: [], tail_reserve_per_buyer_eur: 0 } },
  { tax_components: [] }, { tax_components: [{ share_of_gross: 0.5, vat_rate: 0.2 }] },
  { fee_rate_of_gross: NaN }, { target_margin_rate_of_net: 1 }, { candidate_prices_gross_eur: [] }
]) assert.throws(() => calculatePricing({ ...sample, ...overrides }));
const empty = JSON.parse(await readFile(new URL('../commerce/pricing-input.example.json', import.meta.url)));
assert.throws(() => calculatePricing(empty));
console.log('OK : réserve Arbitre, taxes simples/composites, marge, seuil de ventes et refus des coûts inconnus.');
