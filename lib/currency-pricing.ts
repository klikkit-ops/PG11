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
  // Stripe Price IDs - these should be set via environment variables
  stripePriceIds?: {
    trial?: string;
    weekly?: string;
    annual?: string;
  };
}

// Pricing for supported currencies
export const CURRENCY_PRICING: Record<string, CurrencyPricing> = {
  USD: {
    currency: "USD",
    symbol: "$",
    trial: 0.59,
    weekly: 7.99,
    annual: 69.99,
    stripePriceIds: {
      trial: process.env.NEXT_PUBLIC_STRIPE_PRICE_TRIAL_USD || process.env.NEXT_PUBLIC_STRIPE_PRICE_TRIAL || '',
      weekly: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY_USD || process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY || '',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_USD || process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || '',
    },
  },
  GBP: {
    currency: "GBP",
    symbol: "£",
    trial: 0.49,
    weekly: 5.99,
    annual: 59.99,
    stripePriceIds: {
      trial: process.env.NEXT_PUBLIC_STRIPE_PRICE_TRIAL_GBP || '',
      weekly: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY_GBP || '',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_GBP || '',
    },
  },
  EUR: {
    currency: "EUR",
    symbol: "€",
    trial: 0.49,
    weekly: 7.49,
    annual: 64.99,
    stripePriceIds: {
      trial: process.env.NEXT_PUBLIC_STRIPE_PRICE_TRIAL_EUR || '',
      weekly: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY_EUR || '',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_EUR || '',
    },
  },
  CAD: {
    currency: "CAD",
    symbol: "$",
    trial: 0.75,
    weekly: 10.99,
    annual: 94.99,
    stripePriceIds: {
      trial: process.env.NEXT_PUBLIC_STRIPE_PRICE_TRIAL_CAD || '',
      weekly: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY_CAD || '',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_CAD || '',
    },
  },
  AUD: {
    currency: "AUD",
    symbol: "$",
    trial: 0.75,
    weekly: 12.99,
    annual: 109.99,
    stripePriceIds: {
      trial: process.env.NEXT_PUBLIC_STRIPE_PRICE_TRIAL_AUD || '',
      weekly: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY_AUD || '',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_AUD || '',
    },
  },
};

/**
 * Get pricing for a specific currency
 */
export function getPricingForCurrency(currencyCode: string): CurrencyPricing | null {
  return CURRENCY_PRICING[currencyCode] || CURRENCY_PRICING.USD || null;
}

/**
 * Get Stripe Price ID for a plan type and currency
 */
export function getStripePriceId(
  planType: "TRIAL" | "WEEKLY" | "ANNUAL",
  currencyCode: string
): string | null {
  const pricing = getPricingForCurrency(currencyCode);
  if (!pricing?.stripePriceIds) {
    return null;
  }

  switch (planType) {
    case "TRIAL":
      return pricing.stripePriceIds.trial || null;
    case "WEEKLY":
      return pricing.stripePriceIds.weekly || null;
    case "ANNUAL":
      return pricing.stripePriceIds.annual || null;
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

