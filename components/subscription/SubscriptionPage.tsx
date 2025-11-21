"use client";

import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/billing";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PetAvatar } from "@/components/ui/pet-avatar";

type Props = {
    user: User;
    hasUsedTrial?: boolean;
};

type PlanType = "TRIAL" | "WEEKLY" | "ANNUAL";

export default function SubscriptionPage({ user, hasUsedTrial = false }: Props) {
    const [selectedPlan, setSelectedPlan] = useState<PlanType>(hasUsedTrial ? "WEEKLY" : "TRIAL");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const trialPlan = PLANS.TRIAL;
    const weeklyPlan = PLANS.WEEKLY;
    const annualPlan = PLANS.ANNUAL;

    const handleSubscribe = () => {
        if (!trialPlan.stripePriceId && selectedPlan === "TRIAL") {
            toast({
                title: "Configuration Error",
                description: "Trial plan is not configured. Please contact support.",
                variant: "destructive",
            });
            return;
        }

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

        // Redirect to custom checkout page
        router.push(`/checkout?plan=${selectedPlan}`);
    };

    const currentPlan = selectedPlan === "TRIAL" ? trialPlan : selectedPlan === "WEEKLY" ? weeklyPlan : annualPlan;

    return (
        <div className="min-h-screen relative">
            {/* Decorative pet avatars in side margins */}
            <PetAvatar petId={4} size="lg" style={{ position: 'fixed', top: '12rem', right: '1rem' }} className="hidden xl:block" />
            <PetAvatar petId={2} size="md" style={{ position: 'fixed', bottom: '8rem', left: '1rem' }} className="hidden lg:block" />
            <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Choose Your Plan
                    </h1>
                    <p className="text-lg text-foreground/90 max-w-2xl mx-auto font-medium">
                        Select a subscription plan to start creating amazing dancing videos of your pet.
                    </p>
                </div>

                {/* Plan Toggle */}
                <div className="flex justify-center">
                    <div className="w-full max-w-full mx-auto">
                        <div className="flex gap-1.5 sm:gap-2 p-1 sm:p-1.5 glass-panel w-full justify-center">
                        {!hasUsedTrial && (
                            <button
                                onClick={() => setSelectedPlan("TRIAL")}
                                className={`px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 relative whitespace-nowrap flex-shrink-0 ${selectedPlan === "TRIAL"
                                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Trial
                                <span className="ml-1.5 sm:ml-2 text-xs bg-white/90 text-purple-700 px-1.5 sm:px-2 py-0.5 rounded-full border border-white/50 shadow-sm font-semibold">
                                    $0.59
                                </span>
                            </button>
                        )}
                        <button
                            onClick={() => setSelectedPlan("WEEKLY")}
                            className={`px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 whitespace-nowrap flex-shrink-0 ${selectedPlan === "WEEKLY"
                                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Weekly
                        </button>
                        <button
                            onClick={() => setSelectedPlan("ANNUAL")}
                            className={`px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 relative whitespace-nowrap flex-shrink-0 ${selectedPlan === "ANNUAL"
                                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Yearly
                        </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Plan Details */}
                    <div className="glass-panel p-8 space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">
                                PetGroove {currentPlan.label}
                            </h2>
                            <p className="text-foreground font-medium">
                                {selectedPlan === "TRIAL"
                                    ? `${currentPlan.creditsPerPeriod} Coins`
                                    : selectedPlan === "WEEKLY"
                                    ? `${currentPlan.creditsPerPeriod.toLocaleString()} Coins per ${currentPlan.billingPeriod} (renews weekly)`
                                    : `${currentPlan.creditsPerPeriod.toLocaleString()} Coins (provided upfront)`}
                            </p>
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                ${currentPlan.price.toFixed(2)}
                            </span>
                            <span className="text-xl text-foreground/70 font-medium">
                                {selectedPlan === "TRIAL" ? " for 3-day trial" : ` / ${currentPlan.billingPeriod === "week" ? "week" : "year"}`}
                            </span>
                        </div>

                        {/* Features */}
                        <div className="space-y-4 py-6">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="text-base text-foreground font-medium">
                                    {selectedPlan === "TRIAL"
                                        ? "100 Coins"
                                        : selectedPlan === "WEEKLY" 
                                        ? "10 video generations per week"
                                        : "70 video generations (provided upfront)"}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="text-base text-foreground font-medium">All dance styles included</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="text-base text-foreground font-medium">HD video quality</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="text-base text-foreground font-medium">Download anytime</span>
                            </div>
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
                                {selectedPlan === "TRIAL" ? (
                                    <>
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg mb-1">Try PetGroove Risk-Free</h4>
                                                <p className="text-sm text-foreground">
                                                    Get 100 coins to create your first dancing video. No commitment required.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg mb-1">All Dance Styles</h4>
                                                <p className="text-sm text-foreground/80">
                                                    Access to all 10+ dance styles including Macarena, Hip Hop, Ballet, and more.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg mb-1">Instant Access</h4>
                                                <p className="text-sm text-foreground/80">
                                                    Start creating videos immediately after subscribing. No waiting period.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg mb-1">Download Anytime</h4>
                                                <p className="text-sm text-foreground/80">
                                                    Download and share your videos whenever you want, forever.
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg mb-1">Unlimited Video Generations</h4>
                                                <p className="text-sm text-foreground">
                                                    Create as many dancing videos as your coins allow. {selectedPlan === "WEEKLY" ? "Coins renew weekly." : "All coins provided upfront."}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg mb-1">All Dance Styles</h4>
                                                <p className="text-sm text-foreground/80">
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
                                                <p className="text-sm text-foreground/80">
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
                                                <p className="text-sm text-foreground/80">
                                                    No long-term commitment. Cancel your subscription at any time.
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="glass-panel p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl flex-shrink-0">🎉</span>
                                <div>
                                    <p className="font-semibold text-green-700 dark:text-green-400 mb-1">
                                        7-Day Satisfaction Guarantee
                                    </p>
                                    <p className="text-sm text-foreground/80">
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
