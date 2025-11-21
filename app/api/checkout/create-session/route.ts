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

      // For trial, we need to charge $0.49 upfront
      // We'll create a one-time payment for $0.49, then create the subscription with trial in the webhook
      // First, check if we have a trial price ID, otherwise create a one-time payment session
      
      // Check if there's a dedicated trial price ($0.49 one-time)
      const trialPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_TRIAL;
      // TypeScript knows this is TRIAL plan, so we can safely access weeklyPriceId if it exists
      const weeklyPriceId = (plan as typeof PLANS.TRIAL).weeklyPriceId || plan.stripePriceId;
      
      if (trialPriceId) {
        // Use the trial price for checkout - this will show $0.49 on the checkout page
        // In the webhook, we'll create the subscription with trial period
        const session = await stripe.checkout.sessions.create({
          mode: "payment", // One-time payment for trial
          payment_method_types: ["card"],
          line_items: [
            {
              price: trialPriceId, // $0.49 one-time price
              quantity: 1,
            },
          ],
          client_reference_id: user.id,
          customer_email: user.email || undefined,
          success_url: `${deploymentUrl}/overview/videos?success=true&trial=true`,
          cancel_url: `${deploymentUrl}/get-credits?canceled=true`,
          metadata: {
            user_id: user.id,
            plan_type: planType,
            is_trial: "true",
            weekly_price_id: weeklyPriceId, // Store weekly price ID for webhook
            trial_days: plan.trialDays.toString(),
          },
        });

        return NextResponse.json({
          sessionId: session.id,
          url: session.url,
        });
      } else {
        // Fallback: Create subscription with trial period (will show as "free")
        // The $0.49 will be charged via invoice item in webhook
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price: weeklyPriceId, // Weekly price - will start after trial
              quantity: 1,
            },
          ],
          subscription_data: {
            trial_period_days: plan.trialDays,
            metadata: {
              user_id: user.id,
              plan_type: planType,
              is_trial: "true",
              renews_to: plan.renewsTo || "WEEKLY",
            },
          },
          payment_method_collection: "always",
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
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
