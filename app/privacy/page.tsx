import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">Last updated: November 21, 2024</p>
        </div>

        {/* Content */}
        <div className="glass-panel p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-foreground/90 leading-relaxed">
              PetGroove ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. Please read this policy carefully to understand our practices regarding your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li><strong className="font-semibold">Account Information:</strong> Email address, password, and profile information</li>
              <li><strong className="font-semibold">Payment Information:</strong> Processed securely through Stripe. We do not store your full credit card details</li>
              <li><strong className="font-semibold">Content:</strong> Images and videos you upload, including pet photos and generated videos</li>
              <li><strong className="font-semibold">Communications:</strong> Information you provide when contacting our support team</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li><strong className="font-semibold">Usage Data:</strong> How you interact with our service, pages visited, features used</li>
              <li><strong className="font-semibold">Device Information:</strong> Browser type, device type, operating system, IP address</li>
              <li><strong className="font-semibold">Log Data:</strong> Server logs, error reports, and diagnostic information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Provide, maintain, and improve our service</li>
              <li>Process payments and manage subscriptions</li>
              <li>Generate videos using AI models</li>
              <li>Send you service-related notifications and updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Monitor and analyze usage patterns to improve our service</li>
              <li>Detect, prevent, and address technical issues or security concerns</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Service Providers</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We share information with trusted third-party service providers who help us operate our service, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li><strong className="font-semibold">Stripe:</strong> Payment processing (see Stripe's privacy policy for details)</li>
              <li><strong className="font-semibold">Supabase:</strong> Database and authentication services</li>
              <li><strong className="font-semibold">Vercel:</strong> Hosting and infrastructure</li>
              <li><strong className="font-semibold">Replicate:</strong> AI video generation services</li>
              <li><strong className="font-semibold">OpenAI:</strong> AI prompt generation services</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Legal Requirements</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We may disclose your information if required by law, court order, or government regulation, or to protect our rights, property, or safety, or that of our users or others.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Business Transfers</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Storage and Security</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Encryption of data in transit using SSL/TLS</li>
              <li>Secure storage of data in encrypted databases</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication measures</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We retain your information for as long as necessary to provide our service and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li><strong className="font-semibold">Access:</strong> Request access to your personal information</li>
              <li><strong className="font-semibold">Correction:</strong> Request correction of inaccurate information</li>
              <li><strong className="font-semibold">Deletion:</strong> Request deletion of your personal information</li>
              <li><strong className="font-semibold">Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong className="font-semibold">Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mt-4">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:support@petgroove.app" className="text-primary hover:underline">
                support@petgroove.app
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Your information may be transferred to and processed in countries other than your own. These countries may have different data protection laws than your country. By using our service, you consent to the transfer of your information to these countries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-foreground/90 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at{" "}
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

