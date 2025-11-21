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
      // Create subscription with 3-day trial that auto-renews to weekly
      // We'll charge $0.49 as a setup fee using invoice items in the webhook
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: plan.stripePriceId, // Weekly price - will start after trial
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
