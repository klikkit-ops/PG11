/**
 * Billing configuration for PetGroove
 * Maps Stripe price IDs to credit allocations and plan details
 */

export const PLANS = {
  TRIAL: {
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TRIAL || '', // Trial price - must be created in Stripe with multi-currency support
    creditsPerPeriod: 100, // 100 coins for 1 generation during trial
    label: "3-Day Trial",
    price: 0.59, // USD price - actual price varies by currency (USD: $0.59, GBP: £0.49, EUR: €0.49, CAD: $0.75, AUD: $0.75)
    billingPeriod: "trial" as const,
    trialDays: 3,
    renewsTo: "WEEKLY" as const,
    weeklyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY || '', // Weekly price to convert to after trial
  },
  WEEKLY: {
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY || '',
    creditsPerPeriod: 1000, // 1,000 coins per week (10 videos at 100 coins each)
    label: "Weekly",
    price: 7.99, // USD price - actual price varies by currency (USD: $7.99, GBP: £5.99, EUR: €7.49, CAD: $10.99, AUD: $12.99)
    billingPeriod: "week" as const,
  },
  ANNUAL: {
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || '',
    creditsPerPeriod: 9000, // 9,000 coins per year (provided upfront)
    label: "Annual",
    price: 69.99, // USD price - actual price varies by currency (USD: $69.99, GBP: £59.99, EUR: €64.99, CAD: $94.99, AUD: $109.99)
    billingPeriod: "year" as const,
  },
} as const;

export type PlanType = keyof typeof PLANS;
export type BillingPeriod = "trial" | "week" | "year";

/**
 * Get plan by Stripe price ID
 */
export function getPlanByPriceId(priceId: string): typeof PLANS.WEEKLY | typeof PLANS.ANNUAL | typeof PLANS.TRIAL | null {
  if (priceId === PLANS.WEEKLY.stripePriceId) {
    // Check if this is a trial subscription by checking subscription metadata
    // For now, we'll return WEEKLY and handle trial logic in webhook
    return PLANS.WEEKLY;
  }
  if (priceId === PLANS.ANNUAL.stripePriceId) {
    return PLANS.ANNUAL;
  }
  return null;
}

/**
 * Get credits per period for a given price ID
 */
export function getCreditsPerPeriod(priceId: string): number {
  const plan = getPlanByPriceId(priceId);
  return plan?.creditsPerPeriod || 0;
}

/**
 * Validate that all required plan environment variables are set
 */
export function validateBillingConfig(): void {
  if (!PLANS.WEEKLY.stripePriceId) {
    throw new Error("NEXT_PUBLIC_STRIPE_PRICE_WEEKLY is not set");
  }
  if (!PLANS.ANNUAL.stripePriceId) {
    throw new Error("NEXT_PUBLIC_STRIPE_PRICE_ANNUAL is not set");
  }
}

