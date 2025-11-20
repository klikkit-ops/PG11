"use client";

import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/billing";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PetAvatar } from "@/components/PetAvatar";

type Props = {
  user: User;
};

type PlanType = "WEEKLY" | "ANNUAL";

export default function SubscriptionPage({ user }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("WEEKLY");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const weeklyPlan = PLANS.WEEKLY;
  const annualPlan = PLANS.ANNUAL;

  const handleSubscribe = async () => {
    if (!weeklyPlan.stripePriceId && selectedPlan === "WEEKLY") {
      toast({
        title: "Configuration Error",
        description: "Weekly plan is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    if (!annualPlan.stripePriceId && selectedPlan === "ANNUAL") {
      toast({
        title: "Configuration Error",
        description: "Annual plan is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: selectedPlan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const currentPlan = selectedPlan === "WEEKLY" ? weeklyPlan : annualPlan;
  const savings = annualPlan.price < weeklyPlan.price * 52
    ? Math.round(((weeklyPlan.price * 52 - annualPlan.price) / (weeklyPlan.price * 52)) * 100)
    : 0;

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <PetAvatar index={1} className="absolute top-20 right-10 hidden lg:block" size={180} animate />
      <PetAvatar index={2} className="absolute bottom-20 left-10 hidden lg:block" size={200} flip animate />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select a subscription plan to start creating amazing dancing videos of your pet.
          </p>
        </div>

        {/* Plan Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex gap-2 p-1.5 glass-panel">
            <button
              onClick={() => setSelectedPlan("WEEKLY")}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${selectedPlan === "WEEKLY"
                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSelectedPlan("ANNUAL")}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 relative ${selectedPlan === "ANNUAL"
                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Yearly
              {savings > 0 && (
                <span className="ml-2 text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full border border-green-500/30">
                  Save {savings}%
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Plan Details */}
          <div className="glass-panel p-8 space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                PetGroove {currentPlan.label}
              </h2>
              <p className="text-muted-foreground">
                {selectedPlan === "WEEKLY"
                  ? `${currentPlan.creditsPerPeriod} credits per ${currentPlan.billingPeriod}`
                  : `${currentPlan.creditsPerPeriod} credits per ${currentPlan.billingPeriod}`}
              </p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                ${currentPlan.price.toFixed(2)}
              </span>
              <span className="text-xl text-muted-foreground">
                / {currentPlan.billingPeriod === "week" ? "week" : "year"}
              </span>
            </div>

            {/* Features */}
            <div className="space-y-4 py-6">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-base">
                  {currentPlan.creditsPerPeriod} video generations per{" "}
                  {currentPlan.billingPeriod === "week" ? "week" : "year"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-base">All dance styles included</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-base">HD video quality</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-base">Download anytime</span>
              </div>
              {selectedPlan === "ANNUAL" && savings > 0 && (
                <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                  <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-base font-semibold text-green-600">
                    Save {savings}% compared to weekly billing
                  </span>
                </div>
              )}
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              variant="gradient"
              className="w-full h-14 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Subscribe Now"
              )}
            </Button>
          </div>

          {/* Right Column: Benefits */}
          <div className="space-y-6">
            <div className="glass-panel p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">✨</span>
                What's Included
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Unlimited Video Generations</h4>
                    <p className="text-sm text-muted-foreground">
                      Create as many dancing videos as your credits allow. Credits reset each billing period.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">All Dance Styles</h4>
                    <p className="text-sm text-muted-foreground">
                      Access to all 10+ dance styles including Macarena, Hip Hop, Ballet, and more.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">HD Quality Videos</h4>
                    <p className="text-sm text-muted-foreground">
                      All videos are generated in high definition, perfect for sharing on social media.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Cancel Anytime</h4>
                    <p className="text-sm text-muted-foreground">
                      No long-term commitment. Cancel your subscription at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🎉</span>
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-400 mb-1">
                    7-Day Satisfaction Guarantee
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Not happy with your subscription? Contact us within 7 days for a full refund.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
