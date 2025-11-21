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
    const { planType, paymentMethodId, currency, stripePriceId } = body;

    if (!planType || !(planType in PLANS)) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      );
    }

    const plan = PLANS[planType as keyof typeof PLANS];

    // Use the provided stripePriceId (currency-specific) or fall back to default
    const priceIdToUse = stripePriceId || plan.stripePriceId;

    if (!priceIdToUse) {
      return NextResponse.json(
        { error: "Stripe price ID not configured for this plan" },
        { status: 500 }
      );
    }

    // Get or create customer
    // First, try to find existing customer by email
    let customerId: string;
    const existingCustomers = await stripe.customers.list({
      email: user.email || undefined,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      // Update metadata to ensure user_id is set
      await stripe.customers.update(customerId, {
        metadata: {
          user_id: user.id,
        },
      });
    } else {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Handle trial subscription
    if (planType === "TRIAL" && 'trialDays' in plan) {
      const weeklyPriceId = (plan as typeof PLANS.TRIAL).weeklyPriceId || PLANS.WEEKLY.stripePriceId;

      if (!weeklyPriceId) {
        return NextResponse.json(
          { error: "Weekly price ID is required for trial" },
          { status: 500 }
        );
      }

      // Attach payment method to customer
      if (paymentMethodId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });

        // Set as default payment method
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      // Use the weekly price ID (Stripe handles multi-currency automatically)
      const weeklyPriceIdForCurrency = weeklyPriceId;

      // Create subscription with trial period
      // Stripe will automatically use the correct currency price from the multi-currency Price object
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: weeklyPriceId,
          },
        ],
        trial_period_days: plan.trialDays, // 3 days
        default_payment_method: paymentMethodId,
        metadata: {
          user_id: user.id,
          plan_type: planType,
          is_trial: "true",
          renews_to: "WEEKLY",
          checkout_type: "custom", // Mark as custom checkout to avoid double-charging in webhook
          currency: currency || "USD",
        },
      });

      // Charge $0.49 immediately (already done via payment intent)
      // The webhook will handle granting credits and marking trial as used

      return NextResponse.json({
        subscriptionId: subscription.id,
        status: subscription.status,
      });
    }

    // Handle regular subscriptions
    // Attach payment method to customer
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription
    // Stripe will automatically use the correct currency price from the multi-currency Price object
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceIdToUse,
        },
      ],
      default_payment_method: paymentMethodId,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        currency: currency || "USD",
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create subscription";
    const stripeError = error as any;
    if (stripeError?.type && stripeError?.message) {
      console.error("Stripe error details:", {
        type: stripeError.type,
        message: stripeError.message,
        code: stripeError.code,
        param: stripeError.param,
      });
    }
    return NextResponse.json(
      { error: errorMessage, details: stripeError?.message || errorMessage },
      { status: 500 }
    );
  }
}

