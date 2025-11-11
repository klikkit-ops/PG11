/**
 * Billing configuration for PetGroove
 * Maps Stripe price IDs to credit allocations and plan details
 */

export const PLANS = {
  WEEKLY: {
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY || '',
    creditsPerPeriod: 10, // 10 videos per week
    label: "Weekly",
    price: 7.99,
    billingPeriod: "week" as const,
  },
  ANNUAL: {
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || '',
    creditsPerPeriod: 600, // 600 videos per year (approximately 11-12 per week)
    label: "Annual",
    price: 69.99,
    billingPeriod: "year" as const,
  },
} as const;

export type PlanType = keyof typeof PLANS;
export type BillingPeriod = "week" | "year";

/**
 * Get plan by Stripe price ID
 */
export function getPlanByPriceId(priceId: string): typeof PLANS.WEEKLY | typeof PLANS.ANNUAL | null {
  if (priceId === PLANS.WEEKLY.stripePriceId) {
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

