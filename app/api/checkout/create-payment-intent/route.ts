import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Database } from "@/types/supabase";
import { PLANS } from "@/lib/billing";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

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
    const { planType } = body;

    if (!planType || !(planType in PLANS)) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      );
    }

    const plan = PLANS[planType as keyof typeof PLANS];

    // For trial, create a payment intent for $0.49
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

      if (creditsData?.has_used_trial) {
        return NextResponse.json(
          { error: "You have already used your trial. Please choose a regular subscription plan." },
          { status: 400 }
        );
      }

      // Create payment intent for $0.49
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 49, // $0.49 in cents
        currency: "usd",
        metadata: {
          user_id: user.id,
          plan_type: planType,
          is_trial: "true",
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
      });
    }

    // For regular plans, create payment intent for the plan price
    const amount = Math.round(plan.price * 100); // Convert to cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

