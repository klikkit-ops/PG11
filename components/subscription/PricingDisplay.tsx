"use client";

import { getPricingForCurrency, formatPrice } from "@/lib/currency-pricing";
import { type CountryInfo } from "@/lib/countries";
import { PLANS } from "@/lib/billing";

type PlanType = "TRIAL" | "WEEKLY" | "ANNUAL";

interface PricingDisplayProps {
  planType: PlanType;
  selectedCountry: CountryInfo;
}

export default function PricingDisplay({ planType, selectedCountry }: PricingDisplayProps) {
  const plan = PLANS[planType];
  const isTrial = planType === "TRIAL";
  const weeklyPlan = PLANS.WEEKLY;

  const pricing = getPricingForCurrency(selectedCountry.currency);
  
  if (!pricing) {
    // Fallback to USD if currency not found
    const usdPricing = getPricingForCurrency("USD");
    if (!usdPricing) {
      return null;
    }
    
    return (
      <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-lg">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            {isTrial ? formatPrice(usdPricing.trial, "USD") : formatPrice(plan.price, "USD")}
          </span>
          {isTrial ? (
            <span className="text-muted-foreground text-lg">today</span>
          ) : (
            <span className="text-muted-foreground text-lg">
              {plan.billingPeriod === "week" ? "per week" : "per year"}
            </span>
          )}
        </div>
        {isTrial && (
          <div className="mt-3 text-muted-foreground text-base">
            Then {formatPrice(usdPricing.weekly, "USD")} per week starting in 3 days
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-lg">
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          {isTrial ? formatPrice(pricing.trial, selectedCountry.currency) : formatPrice(
            planType === "WEEKLY" ? pricing.weekly : pricing.annual,
            selectedCountry.currency
          )}
        </span>
        {isTrial ? (
          <span className="text-muted-foreground text-lg">today</span>
        ) : (
          <span className="text-muted-foreground text-lg">
            {plan.billingPeriod === "week" ? "per week" : "per year"}
          </span>
        )}
      </div>
      {isTrial && (
        <div className="mt-3 text-muted-foreground text-base">
          Then {formatPrice(pricing.weekly, selectedCountry.currency)} per week starting in 3 days
        </div>
      )}
    </div>
  );
}

