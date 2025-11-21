"use client";

import { useState } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/billing";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

type Props = {
  planType: "TRIAL" | "WEEKLY" | "ANNUAL";
  onSuccess?: () => void;
};

function CheckoutForm({ planType, onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const plan = PLANS[planType];
  const isTrial = planType === "TRIAL";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setIsLoading(false);
      return;
    }

    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (pmError || !paymentMethod) {
        toast({
          title: "Payment Failed",
          description: pmError?.message || "Failed to create payment method",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // For trial, charge $0.49 immediately
      if (isTrial) {
        const paymentIntentResponse = await fetch("/api/checkout/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planType }),
        });

        const paymentIntentData = await paymentIntentResponse.json();

        if (!paymentIntentResponse.ok) {
          throw new Error(paymentIntentData.error || "Failed to create payment intent");
        }

        // Confirm payment for $0.49
        const { error: confirmError } = await stripe.confirmCardPayment(
          paymentIntentData.clientSecret,
          {
            payment_method: paymentMethod.id,
          }
        );

        if (confirmError) {
          toast({
            title: "Payment Failed",
            description: confirmError.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Create subscription
      const subscriptionResponse = await fetch("/api/checkout/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          planType,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const subscriptionData = await subscriptionResponse.json();

      if (!subscriptionResponse.ok) {
        throw new Error(subscriptionData.error || "Failed to create subscription");
      }

      toast({
        title: "Success!",
        description: "Your subscription has been activated.",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/overview/videos?success=true");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Pricing Display */}
      <div className="p-6 border rounded-lg bg-white">
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {isTrial ? "$0.49" : `$${plan.price.toFixed(2)}`}
          </div>
          {isTrial && (
            <>
              <div className="text-sm text-muted-foreground">
                Charged today
              </div>
              <div className="text-sm text-muted-foreground">
                Then $7.99 per week starting in 3 days
              </div>
            </>
          )}
          {!isTrial && (
            <div className="text-sm text-muted-foreground">
              {plan.billingPeriod === "week" ? "per week" : "per year"}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 border rounded-lg bg-white">
          <CardElement options={cardElementOptions} />
        </div>

        <Button
          type="submit"
          disabled={!stripe || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Subscribe Now"
          )}
        </Button>
      </form>
    </div>
  );
}

export default function CustomCheckout({ planType, onSuccess }: Props) {
  const options: StripeElementsOptions = {
    appearance: {
      theme: "stripe",
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm planType={planType} onSuccess={onSuccess} />
    </Elements>
  );
}
