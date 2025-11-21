/**
 * Multi-currency pricing configuration
 * Maps currency codes to prices for each plan type
 * 
 * To add prices for a new currency:
 * 1. Add the currency code and prices below
 * 2. Create Stripe Price objects in your Stripe dashboard for each plan
 * 3. Add the Stripe Price IDs to your environment variables
 * 4. Update the getStripePriceId function to map currency to price IDs
 */

export interface CurrencyPricing {
  currency: string;
  symbol: string;
  trial: number;
  weekly: number;
  annual: number;
}

// Pricing for supported currencies
// Note: Stripe handles multi-currency pricing within a single Price object
// We only need one Price ID per plan type, and Stripe will use the correct currency
export const CURRENCY_PRICING: Record<string, CurrencyPricing> = {
  USD: {
    currency: "USD",
    symbol: "$",
    trial: 0.59,
    weekly: 7.99,
    annual: 69.99,
  },
  GBP: {
    currency: "GBP",
    symbol: "£",
    trial: 0.49,
    weekly: 5.99,
    annual: 59.99,
  },
  EUR: {
    currency: "EUR",
    symbol: "€",
    trial: 0.49,
    weekly: 7.49,
    annual: 64.99,
  },
  CAD: {
    currency: "CAD",
    symbol: "$",
    trial: 0.75,
    weekly: 10.99,
    annual: 94.99,
  },
  AUD: {
    currency: "AUD",
    symbol: "$",
    trial: 0.75,
    weekly: 12.99,
    annual: 109.99,
  },
};

/**
 * Get pricing for a specific currency
 */
export function getPricingForCurrency(currencyCode: string): CurrencyPricing | null {
  return CURRENCY_PRICING[currencyCode] || CURRENCY_PRICING.USD || null;
}

/**
 * Get Stripe Price ID for a plan type
 * Since Stripe supports multi-currency pricing in a single Price object,
 * we only need one Price ID per plan type (not per currency)
 */
export function getStripePriceId(planType: "TRIAL" | "WEEKLY" | "ANNUAL"): string | null {
  // Import PLANS here to avoid circular dependency
  const { PLANS } = require("@/lib/billing");
  
  switch (planType) {
    case "TRIAL":
      return PLANS.TRIAL.stripePriceId || null;
    case "WEEKLY":
      return PLANS.WEEKLY.stripePriceId || null;
    case "ANNUAL":
      return PLANS.ANNUAL.stripePriceId || null;
    default:
      return null;
  }
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currencyCode: string): string {
  const pricing = getPricingForCurrency(currencyCode);
  if (!pricing) {
    return `$${amount.toFixed(2)}`;
  }

  // Format based on currency conventions
  // EUR and GBP typically show symbol before amount
  // For consistency, we'll show symbol before amount for all currencies
  return `${pricing.symbol}${amount.toFixed(2)}`;
}

