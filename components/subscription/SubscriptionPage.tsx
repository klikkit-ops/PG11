"use client";

import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/billing";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Plan Selection */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
              <p className="text-muted-foreground text-lg">
                Select a subscription plan to start creating amazing dancing videos of your pet.
              </p>
            </div>

            {/* Plan Toggle */}
            <div className="flex gap-4 p-1 bg-gray-900/50 rounded-lg border border-gray-700">
              <button
                onClick={() => setSelectedPlan("WEEKLY")}
                className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
                  selectedPlan === "WEEKLY"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setSelectedPlan("ANNUAL")}
                className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
                  selectedPlan === "ANNUAL"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Yearly
                {savings > 0 && (
                  <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                    Save {savings}%
                  </span>
                )}
              </button>
            </div>

            {/* Plan Details */}
            <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  PetGroove {currentPlan.label} Subscription
                </h2>
                <p className="text-muted-foreground text-sm">
                  {selectedPlan === "WEEKLY"
                    ? `${currentPlan.label.toLowerCase()} subscription - ${currentPlan.creditsPerPeriod} credits/${currentPlan.billingPeriod} (${currentPlan.creditsPerPeriod} video generations)`
                    : `${currentPlan.label.toLowerCase()} subscription - ${currentPlan.creditsPerPeriod} credits/${currentPlan.billingPeriod} (${currentPlan.creditsPerPeriod} video generations)`}
                </p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">
                  ${currentPlan.price.toFixed(2)}
                </span>
                <span className="text-muted-foreground text-lg">
                  per {currentPlan.billingPeriod === "week" ? "week" : "year"}
                </span>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">
                    {currentPlan.creditsPerPeriod} video generations per{" "}
                    {currentPlan.billingPeriod === "week" ? "week" : "year"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">All dance styles included</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">HD video quality</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">Download anytime</span>
                </div>
                {selectedPlan === "ANNUAL" && savings > 0 && (
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-green-400">
                      Save {savings}% compared to weekly billing
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full h-12 text-white font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Subscribe"
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Benefits/Info */}
          <div className="space-y-6">
            <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-6">
              <h3 className="text-2xl font-bold mb-4">What's Included</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Unlimited Video Generations</h4>
                    <p className="text-sm text-muted-foreground">
                      Create as many dancing videos as your credits allow. Credits reset each billing period.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">All Dance Styles</h4>
                    <p className="text-sm text-muted-foreground">
                      Access to all 10+ dance styles including Macarena, Hip Hop, Ballet, and more.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">HD Quality Videos</h4>
                    <p className="text-sm text-muted-foreground">
                      All videos are generated in high definition, perfect for sharing on social media.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Cancel Anytime</h4>
                    <p className="text-sm text-muted-foreground">
                      No long-term commitment. Cancel your subscription at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-400">
                <strong>7-day satisfaction guarantee:</strong> Not happy with your subscription? 
                Contact us within 7 days for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
