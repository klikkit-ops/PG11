/**
 * Billing configuration for PetGroove
 * Maps Stripe price IDs to credit allocations and plan details
 */

export const PLANS = {
  TRIAL: {
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TRIAL || '', // Trial price ($0.49/week) - must be created in Stripe
    creditsPerPeriod: 100, // 100 coins for 1 generation during trial
    label: "3-Day Trial",
    price: 0.49,
    billingPeriod: "trial" as const,
    trialDays: 3,
    renewsTo: "WEEKLY" as const,
    weeklyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY || '', // Weekly price to convert to after trial
  },
  WEEKLY: {
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY || '',
    creditsPerPeriod: 1000, // 1,000 coins per week (10 videos at 100 coins each)
    label: "Weekly",
    price: 7.99,
    billingPeriod: "week" as const,
  },
  ANNUAL: {
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || '',
    creditsPerPeriod: 7000, // 7,000 coins per year (provided upfront)
    label: "Annual",
    price: 69.99,
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

