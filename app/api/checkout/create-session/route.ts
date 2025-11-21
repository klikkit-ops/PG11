import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Database } from "@/types/supabase";
import { PLANS } from "@/lib/billing";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const deploymentUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.DEPLOYMENT_URL || "https://petgroove.app";

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-08-16",
  typescript: true,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planType } = body; // "TRIAL", "WEEKLY", or "ANNUAL"

    if (!planType || !(planType in PLANS)) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      );
    }

    const plan = PLANS[planType as keyof typeof PLANS];
    
    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: "Stripe price ID not configured for this plan" },
        { status: 500 }
      );
    }

    // Handle trial subscription
    if (planType === "TRIAL" && 'trialDays' in plan) {
      // Check if user has already used a trial
      const { data: creditsData, error: creditsError } = await supabase
        .from("credits")
        .select("has_used_trial")
        .eq("user_id", user.id)
        .single();

      if (creditsError && creditsError.code !== "PGRST116") {
        console.error("Error checking trial status:", creditsError);
        return NextResponse.json(
          { error: "Failed to check trial eligibility" },
          { status: 500 }
        );
      }

      // If user has already used a trial, prevent them from starting another one
      if (creditsData?.has_used_trial) {
        return NextResponse.json(
          { error: "You have already used your trial. Please choose a regular subscription plan." },
          { status: 400 }
        );
      }

      // For trial, we'll use a separate $0.49/week Stripe price
      // This will show "$0.49 per week" on checkout
      // In the webhook, we'll update the subscription to use the weekly price after the first billing cycle
      
      // TypeScript knows this is TRIAL plan, so we can safely access weeklyPriceId if it exists
      const trialPriceId = plan.stripePriceId; // This should be NEXT_PUBLIC_STRIPE_PRICE_TRIAL ($0.49/week)
      const weeklyPriceId = (plan as typeof PLANS.TRIAL).weeklyPriceId || PLANS.WEEKLY.stripePriceId;
      
      // Validate that we have both price IDs
      if (!trialPriceId) {
        console.error("Missing trial price ID - NEXT_PUBLIC_STRIPE_PRICE_TRIAL must be set");
        return NextResponse.json(
          { error: "Trial subscription configuration error: Trial price ID (NEXT_PUBLIC_STRIPE_PRICE_TRIAL) is required. Please create a $0.49/week price in Stripe." },
          { status: 500 }
        );
      }
      
      if (!weeklyPriceId) {
        console.error("Missing weekly price ID for trial subscription");
        return NextResponse.json(
          { error: "Trial subscription configuration error: Weekly price ID is required" },
          { status: 500 }
        );
      }
      
      try {
        // Calculate when the trial period ends (3 days from now)
        const trialEndDate = Math.floor(Date.now() / 1000) + (plan.trialDays * 24 * 60 * 60);
        
        // Use the weekly price with trial_period_days
        // This will show "$7.99 per week" on checkout, but we'll charge $0.49 immediately via invoice
        // Then create a subscription schedule in the webhook to show the correct pricing
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price: weeklyPriceId, // Weekly price - will show on checkout
              quantity: 1,
            },
          ],
          subscription_data: {
            trial_period_days: plan.trialDays,
            metadata: {
              user_id: user.id,
              plan_type: planType,
              is_trial: "true",
              renews_to: "WEEKLY",
              trial_price_id: trialPriceId, // Store trial price ID for schedule
              weekly_price_id: weeklyPriceId,
              trial_days: plan.trialDays.toString(),
              trial_end_timestamp: trialEndDate.toString(),
            },
          },
          payment_method_collection: "always", // Require payment method upfront
          client_reference_id: user.id,
          customer_email: user.email || undefined,
          success_url: `${deploymentUrl}/overview/videos?success=true`,
          cancel_url: `${deploymentUrl}/get-credits?canceled=true`,
          metadata: {
            user_id: user.id,
            plan_type: planType,
            is_trial: "true",
          },
        });

        return NextResponse.json({
          sessionId: session.id,
          url: session.url,
        });
      } catch (stripeError: any) {
        console.error("Stripe API error creating trial subscription checkout:", stripeError);
        return NextResponse.json(
          { error: `Stripe error: ${stripeError.message || "Failed to create checkout session"}` },
          { status: 500 }
        );
      }
    }

    // Create Stripe Checkout Session for regular plans
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      success_url: `${deploymentUrl}/overview/videos?success=true`,
      cancel_url: `${deploymentUrl}/get-credits?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    );
  }
}
