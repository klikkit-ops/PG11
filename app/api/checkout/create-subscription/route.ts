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
    const { planType, paymentMethodId, currency, stripePriceId, customerId: providedCustomerId } = body;

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

    // Use provided customer ID or get/create customer
    let customerId: string;
    
    if (providedCustomerId) {
      // Use the provided customer ID (customer was created in checkout flow)
      customerId = providedCustomerId;
      // Update metadata to ensure user_id is set
      await stripe.customers.update(customerId, {
        metadata: {
          user_id: user.id,
        },
      });
    } else {
      // Fallback: Get or create customer (for backwards compatibility)
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

      // Payment method should already be attached from checkout flow
      // But ensure it's set as default payment method
      if (paymentMethodId) {
        // Try to attach if not already attached (won't error if already attached)
        try {
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
          });
        } catch (error: any) {
          // Ignore error if already attached
          if (error?.code !== 'resource_already_exists') {
            console.warn("[Subscription] Payment method attach warning:", error.message);
          }
        }

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
      console.log("[Subscription] Creating trial subscription:", {
        customerId,
        weeklyPriceId,
        paymentMethodId,
        trialDays: plan.trialDays,
      });
      
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
      
      console.log("[Subscription] Trial subscription created successfully:", {
        subscriptionId: subscription.id,
        status: subscription.status,
      });

      // Charge $0.49 immediately (already done via payment intent)
      // Grant coins immediately as a backup (webhook will also handle this but may be delayed)
      if (subscription.status === "trialing") {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (supabaseUrl && supabaseServiceRoleKey) {
            const serviceSupabase = createClient<Database>(
              supabaseUrl,
              supabaseServiceRoleKey,
              {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false,
                },
              }
            );

            // Grant 100 coins for trial (1 generation)
            const { data: existingCredits } = await serviceSupabase
              .from("credits")
              .select("credits")
              .eq("user_id", user.id)
              .single();

            if (existingCredits) {
              await serviceSupabase
                .from("credits")
                .update({ 
                  credits: existingCredits.credits + 100,
                  has_used_trial: true,
                })
                .eq("user_id", user.id);
            } else {
              await serviceSupabase
                .from("credits")
                .insert({
                  user_id: user.id,
                  credits: 100,
                  has_used_trial: true,
                });
            }

            console.log(`[Subscription] Granted 100 trial coins immediately to user ${user.id}`);
          }
        } catch (error) {
          console.error("[Subscription] Error granting coins immediately:", error);
          // Continue - webhook will handle this as fallback
        }
      }

      return NextResponse.json({
        subscriptionId: subscription.id,
        status: subscription.status,
      });
    }

    // Handle regular subscriptions
    // Payment method should already be attached from checkout flow
    if (paymentMethodId) {
      // Try to attach if not already attached (won't error if already attached)
      try {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });
      } catch (error: any) {
        // Ignore error if already attached
        if (error?.code !== 'resource_already_exists') {
          console.warn("[Subscription] Payment method attach warning:", error.message);
        }
      }

      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription
    // Stripe will automatically use the correct currency price from the multi-currency Price object
    console.log("[Subscription] Creating subscription:", {
      customerId,
      priceIdToUse,
      paymentMethodId,
      planType,
    });
    
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
    
    console.log("[Subscription] Subscription created successfully:", {
      subscriptionId: subscription.id,
      status: subscription.status,
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

