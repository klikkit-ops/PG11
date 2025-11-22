"use client";

import { useState } from "react";
import Link from "next/link";
import CustomCheckout from "@/components/subscription/CustomCheckout";
import PricingDisplay from "@/components/subscription/PricingDisplay";
import { getDefaultCountry, type CountryInfo } from "@/lib/countries";

type PlanType = "TRIAL" | "WEEKLY" | "ANNUAL";

interface ClientWrapperProps {
  planType: PlanType;
  userEmail?: string;
}

export default function CheckoutClientWrapper({ planType, userEmail }: ClientWrapperProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(getDefaultCountry());

  return (
    <>
      {/* Left Column - Subscription Details */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Subscribe to {planType === "TRIAL" ? "3-Day Trial" : planType === "WEEKLY" ? "Weekly" : "Annual"}
          </h1>
        </div>

        <div className="space-y-6">
          <PricingDisplay planType={planType} selectedCountry={selectedCountry} />

          <div className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-medium">
                  {planType === "TRIAL" ? "100" : planType === "WEEKLY" ? "1,000" : "7,000"} Coins
                </div>
                <div className="text-sm text-muted-foreground">
                  {planType === "TRIAL" 
                    ? "1 video generation" 
                    : `${planType === "WEEKLY" ? "10" : "70"} video generations`}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-medium">All dance styles included</div>
                <div className="text-sm text-muted-foreground">
                  Access to all 10+ dance styles
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-medium">HD video quality</div>
                <div className="text-sm text-muted-foreground">
                  Perfect for sharing on social media
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Cancel anytime</div>
                <div className="text-sm text-muted-foreground">
                  No long-term commitment
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Payment Form */}
      <div className="space-y-6">
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Pay with card</h2>
          <CustomCheckout 
            planType={planType} 
            userEmail={userEmail}
            onCountryChange={setSelectedCountry}
          />
        </div>

        <div className="text-xs text-muted-foreground space-y-3">
          <p className="leading-relaxed">
            By confirming your subscription, you allow PetGroove to charge your card for this payment and future payments in accordance with our terms.
          </p>
          <div className="flex items-center gap-3 pt-4 border-t border-white/20">
            <span className="text-muted-foreground text-xs">Powered by</span>
            {/* Stripe Logo */}
            {/* Stripe Logo */}
            <img
              src="/logos/stripe-logo.png"
              alt="Stripe"
              className="h-3.5 w-auto"
              width={60}
              height={14}
            />
            <Link href="/terms" className="ml-auto hover:text-foreground transition-colors cursor-pointer text-xs">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors cursor-pointer text-xs">Privacy</Link>
          </div>
        </div>
      </div>
    </>
  );
}

