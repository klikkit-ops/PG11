import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Database } from "@/types/supabase";
import { PLANS } from "@/lib/billing";
import { getPricingForCurrency } from "@/lib/currency-pricing";

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
    const { planType, currency = "USD", customerId } = body;

    // Customer ID is required for all payment intents
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    if (!planType || !(planType in PLANS)) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      );
    }

    const plan = PLANS[planType as keyof typeof PLANS];
    const pricing = getPricingForCurrency(currency) || getPricingForCurrency("USD");

    if (!pricing) {
      return NextResponse.json(
        { error: "Invalid currency" },
        { status: 400 }
      );
    }

    // For trial, create a payment intent for the trial price
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

      // Create payment intent for trial price in selected currency
      const amount = Math.round(pricing.trial * 100); // Convert to cents (or smallest currency unit)
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        customer: customerId, // Attach to customer if provided
        metadata: {
          user_id: user.id,
          plan_type: planType,
          is_trial: "true",
          currency: currency,
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    }

    // For regular plans, create payment intent for the plan price
    const amount = Math.round(
      (planType === "WEEKLY" ? pricing.weekly : pricing.annual) * 100
    ); // Convert to cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      customer: customerId, // Attach to customer
      metadata: {
        user_id: user.id,
        plan_type: planType,
        currency: currency,
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

