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
  userEmail?: string;
  onSuccess?: () => void;
};

function CheckoutForm({ planType, userEmail, onSuccess }: Props) {
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

      // Redirect to success page
      router.push("/overview/videos?success=true");
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground/90">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={userEmail || ""}
          disabled
          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50/50 text-gray-600 cursor-not-allowed transition-all"
        />
      </div>

      {/* Card Information */}
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground/90">
          Card information
        </label>
        <div className="p-4 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm transition-all hover:border-primary/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Name on Card */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2 text-foreground/90">
          Name on card
        </label>
        <input
          type="text"
          id="name"
          placeholder="Full name"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
        />
      </div>

      {/* Country and ZIP */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-2 text-foreground/90">
            Country or region
          </label>
          <select
            id="country"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            {/* Add more countries as needed */}
          </select>
        </div>
        <div>
          <label htmlFor="zip" className="block text-sm font-medium mb-2 text-foreground/90">
            ZIP
          </label>
          <input
            type="text"
            id="zip"
            placeholder="12345"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Subscribe Button */}
      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full h-12 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        variant="gradient"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Subscribe"
        )}
      </Button>
    </form>
  );
}

export default function CustomCheckout({ planType, userEmail, onSuccess }: Props) {
  const options: StripeElementsOptions = {
    appearance: {
      theme: "stripe",
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm planType={planType} userEmail={userEmail} onSuccess={onSuccess} />
    </Elements>
  );
}
