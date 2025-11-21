"use client";

import { useState, useEffect } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/billing";
import { getSupportedCountries, getCountryByCode, getDefaultCountry, type CountryInfo } from "@/lib/countries";
import { getPricingForCurrency, formatPrice, getStripePriceId } from "@/lib/currency-pricing";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

type Props = {
  planType: "TRIAL" | "WEEKLY" | "ANNUAL";
  userEmail?: string;
  onSuccess?: () => void;
  onCountryChange?: (country: CountryInfo) => void;
};

function CheckoutForm({ planType, userEmail, onSuccess, onCountryChange }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(getDefaultCountry());
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canUseApplePay, setCanUseApplePay] = useState(false);

  const plan = PLANS[planType];
  const isTrial = planType === "TRIAL";

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = event.target.value;
    const country = getCountryByCode(countryCode);
    if (country) {
      setSelectedCountry(country);
      onCountryChange?.(country);
      // Update payment request when country changes
      if (paymentRequest) {
        const pricing = getPricingForCurrency(country.currency);
        if (pricing) {
          const amount = isTrial ? pricing.trial : (planType === "WEEKLY" ? pricing.weekly : pricing.annual);
          paymentRequest.update({
            total: {
              label: plan.label,
              amount: Math.round(amount * 100), // Convert to cents
            },
            currency: country.currency.toLowerCase(),
          });
        }
      }
    }
  };

  // Initialize Payment Request (Apple Pay / Google Pay)
  useEffect(() => {
    if (!stripe) return;

    const pricing = getPricingForCurrency(selectedCountry.currency);
    if (!pricing) return;

    const amount = isTrial ? pricing.trial : (planType === "WEEKLY" ? pricing.weekly : pricing.annual);

    const pr = stripe.paymentRequest({
      country: selectedCountry.code,
      currency: selectedCountry.currency.toLowerCase(),
      total: {
        label: plan.label,
        amount: Math.round(amount * 100), // Convert to cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if payment method is available
    pr.canMakePayment().then((result) => {
      if (result) {
        setCanUseApplePay(true);
        setPaymentRequest(pr);
      }
    });

    // Handle payment method
    pr.on("paymentmethod", async (ev) => {
      setIsLoading(true);

      try {
        const currencyCode = selectedCountry.currency;
        const stripePriceId = getStripePriceId(planType);

        if (!stripePriceId) {
          ev.complete("fail");
          toast({
            title: "Error",
            description: "Pricing not configured. Please contact support.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // For trial, create payment intent first
        if (isTrial) {
          const paymentIntentResponse = await fetch("/api/checkout/create-payment-intent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ planType, currency: currencyCode }),
          });

          const paymentIntentData = await paymentIntentResponse.json();

          if (!paymentIntentResponse.ok) {
            ev.complete("fail");
            throw new Error(paymentIntentData.error || "Failed to create payment intent");
          }

          // Confirm payment
          const { error: confirmError } = await stripe.confirmCardPayment(
            paymentIntentData.clientSecret,
            {
              payment_method: ev.paymentMethod.id,
            },
            { handleActions: false }
          );

          if (confirmError) {
            ev.complete("fail");
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
            paymentMethodId: ev.paymentMethod.id,
            currency: currencyCode,
            stripePriceId: stripePriceId,
          }),
        });

        const subscriptionData = await subscriptionResponse.json();

        if (!subscriptionResponse.ok) {
          ev.complete("fail");
          throw new Error(subscriptionData.error || "Failed to create subscription");
        }

        ev.complete("success");

        toast({
          title: "Success!",
          description: "Your subscription has been activated.",
        });

        router.push("/overview/videos?success=true");
      } catch (error) {
        console.error("Error processing payment:", error);
        ev.complete("fail");
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
    });

    return () => {
      // Cleanup if needed
    };
  }, [stripe, selectedCountry, planType, isTrial, plan, toast, router]);

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
      // Get postal code from form
      const zipInput = document.getElementById("zip") as HTMLInputElement;
      const postalCode = zipInput?.value || "";

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          address: {
            country: selectedCountry.code,
            postal_code: postalCode,
          },
        },
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

      // Get or create customer FIRST, before using payment method
      // This ensures payment method can be attached to customer
      const customerResponse = await fetch("/api/checkout/get-or-create-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail || (document.getElementById("email") as HTMLInputElement)?.value,
        }),
      });

      const customerData = await customerResponse.json();
      if (!customerResponse.ok) {
        throw new Error(customerData.error || "Failed to get or create customer");
      }

      const customerId = customerData.customerId;

      // Attach payment method to customer BEFORE using it
      // This allows us to reuse the payment method for subscription
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      // For trial, charge the trial price immediately
      let paymentIntentId: string | null = null;
      
      if (isTrial) {
        const currencyCode = selectedCountry.currency;
        const paymentIntentResponse = await fetch("/api/checkout/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planType, currency: currencyCode, customerId }),
        });

        const paymentIntentData = await paymentIntentResponse.json();

        if (!paymentIntentResponse.ok) {
          throw new Error(paymentIntentData.error || "Failed to create payment intent");
        }

        paymentIntentId = paymentIntentData.paymentIntentId || null;

        // Confirm payment for $0.49 using the attached payment method
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

      // Get the Stripe Price ID (same for all currencies since Stripe handles multi-currency)
      const currencyCode = selectedCountry.currency;
      const stripePriceId = getStripePriceId(planType);
      
      if (!stripePriceId) {
        toast({
          title: "Error",
          description: "Pricing not configured. Please contact support.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create subscription
      // Stripe will automatically use the correct currency price based on the currency parameter
      console.log("[Checkout] Creating subscription with:", {
        planType,
        paymentMethodId: paymentMethod.id,
        currency: currencyCode,
        stripePriceId: stripePriceId,
      });
      
      const subscriptionResponse = await fetch("/api/checkout/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          planType,
          paymentMethodId: paymentMethod.id,
          currency: currencyCode,
          stripePriceId: stripePriceId,
          customerId: customerId, // Pass customer ID so we don't create duplicate
        }),
      });

      const subscriptionData = await subscriptionResponse.json();
      console.log("[Checkout] Subscription response:", {
        ok: subscriptionResponse.ok,
        status: subscriptionResponse.status,
        data: subscriptionData,
      });

      if (!subscriptionResponse.ok) {
        const errorMessage = subscriptionData.details || subscriptionData.error || "Failed to create subscription";
        console.error("Subscription creation failed:", subscriptionData);
        
        // If payment was made but subscription failed, attempt to refund
        if (isTrial && paymentIntentId) {
          try {
            console.log("Attempting to refund payment intent:", paymentIntentId);
            const refundResponse = await fetch("/api/checkout/refund-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ paymentIntentId }),
            });
            
            if (refundResponse.ok) {
              console.log("Refund successful");
            } else {
              console.error("Refund failed:", await refundResponse.json());
            }
          } catch (refundError) {
            console.error("Error attempting refund:", refundError);
          }
        }
        
        throw new Error(errorMessage);
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

      {/* Apple Pay / Google Pay Button */}
      {canUseApplePay && paymentRequest && (
        <div className="pb-2 w-full overflow-x-hidden">
          <div className="w-full max-w-full">
            <PaymentRequestButtonElement
              options={{
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    theme: "dark",
                    height: "48px",
                  },
                },
              }}
            />
          </div>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-muted-foreground">Or</span>
            </div>
          </div>
        </div>
      )}

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

      {/* Country and Postal Code */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-2 text-foreground/90">
            Country or region
          </label>
          <select
            id="country"
            value={selectedCountry.code}
            onChange={handleCountryChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            {getSupportedCountries().map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="zip" className="block text-sm font-medium mb-2 text-foreground/90">
            {selectedCountry.postalCodeLabel}
          </label>
          <input
            type="text"
            id="zip"
            placeholder={
              selectedCountry.code === "US" ? "12345" :
              selectedCountry.code === "GB" ? "SW1A 1AA" :
              selectedCountry.code === "CA" ? "K1A 0A6" :
              selectedCountry.code === "AU" ? "2000" :
              selectedCountry.code === "IE" ? "D02 AF30" :
              "12345"
            }
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

export default function CustomCheckout({ planType, userEmail, onSuccess, onCountryChange }: Props) {
  const options: StripeElementsOptions = {
    appearance: {
      theme: "stripe",
    },
    locale: "en", // You could make this dynamic based on country
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm 
        planType={planType} 
        userEmail={userEmail} 
        onSuccess={onSuccess}
        onCountryChange={onCountryChange}
      />
    </Elements>
  );
}
