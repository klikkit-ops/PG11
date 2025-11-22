import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={user ? "/overview/videos" : "/"} 
            className="text-primary hover:underline inline-flex items-center gap-2 mb-4"
          >
            ← Back to {user ? "Videos" : "Home"}
          </Link>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">Last updated: November 21, 2024</p>
        </div>

        {/* Content */}
        <div className="glass-panel p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-foreground/90 leading-relaxed">
              By accessing and using PetGroove ("we," "us," or "our"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              PetGroove is an AI-powered video generation service that creates dancing videos of pets. We offer various subscription plans with different features and pricing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Subscription Plans and Billing</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Trial Subscription</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We offer a 3-day trial subscription for $0.59 (or equivalent in your local currency). <strong className="font-semibold">By subscribing to the trial, you agree that your subscription will automatically renew to the Weekly subscription plan after 3 days at the then-current weekly rate ($7.99 USD or equivalent in your local currency).</strong> The trial provides you with 100 coins (1 video generation) to try our service. If you do not wish to continue with the subscription, you must cancel before the trial period ends.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Weekly Subscription</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              The Weekly subscription plan costs $7.99 per week (or equivalent in your local currency) and provides 1,000 coins (10 video generations) per week. Subscriptions automatically renew weekly unless cancelled.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Annual Subscription</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              The Annual subscription plan costs $69.99 per year (or equivalent in your local currency) and provides 9,000 coins (90 video generations) upfront. Subscriptions automatically renew annually unless cancelled.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Payment</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              All payments are processed securely through Stripe. By providing payment information, you authorize us to charge your payment method for the subscription fees. Prices are in USD and may vary based on your location and currency.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.5 Cancellation</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of your current billing period. You will continue to have access to the service until the end of the paid period.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.6 Refunds</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We offer a 7-day satisfaction guarantee. If you are not satisfied with your subscription within 7 days of purchase, please contact us for a full refund. Refunds will be processed to your original payment method within 5-10 business days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Coins and Video Generation</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Each video generation requires 100 coins. Coins are provided based on your subscription plan:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Trial: 100 coins (1 generation)</li>
              <li>Weekly: 1,000 coins (10 generations) renewed weekly</li>
              <li>Annual: 9,000 coins (90 generations) provided upfront</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mt-4">
              Unused coins do not roll over between billing periods for Weekly subscriptions. Annual subscriptions provide all coins upfront and they do not expire during the subscription period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You retain all rights to the images and videos you upload to PetGroove. By uploading content, you grant us a license to use, process, and store your content solely for the purpose of providing our service. Generated videos belong to you and may be downloaded and used at your discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Upload content that violates any laws or regulations</li>
              <li>Upload content that infringes on the rights of others</li>
              <li>Upload inappropriate, harmful, or offensive content</li>
              <li>Attempt to reverse engineer or misuse our service</li>
              <li>Use automated systems to access our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Service Availability</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We strive to provide reliable service but do not guarantee uninterrupted or error-free operation. We reserve the right to modify, suspend, or discontinue any part of our service at any time with or without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              To the maximum extent permitted by law, PetGroove shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes via email or through our service. Your continued use of the service after changes are posted constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-foreground/90 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:support@petgroove.app" className="text-primary hover:underline">
                support@petgroove.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

