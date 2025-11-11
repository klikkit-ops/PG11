import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Database } from "@/types/supabase";
import { PLANS } from "@/lib/billing";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const deploymentUrl = process.env.DEPLOYMENT_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://petgroove.app";

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
    const { planType } = body; // "WEEKLY" or "ANNUAL"

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

    // Create Stripe Checkout Session
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
