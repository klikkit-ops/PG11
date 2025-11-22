"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export default function CancelSubscriptionPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  useEffect(() => {
    async function createPortalSession() {
      try {
        // Get the current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        // Create a Stripe billing portal session
        const response = await fetch("/api/stripe/create-portal-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create cancellation session");
        }

        const data = await response.json();
        setPortalUrl(data.url);
        
        // Redirect to Stripe Customer Portal
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        console.error("Error creating portal session:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    }

    createPortalSession();
  }, [supabase, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link 
          href="/overview/videos" 
          className="text-primary hover:underline inline-flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Videos
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Cancel Subscription</CardTitle>
            <CardDescription>
              Manage your subscription, payment methods, and billing history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !error && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">
                  Redirecting to subscription management...
                </p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div className="text-center">
                  <p className="text-destructive font-semibold mb-2">
                    Unable to load subscription management
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {error}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => window.location.reload()} variant="outline">
                      Try Again
                    </Button>
                    <Link href="/overview/videos">
                      <Button variant="ghost">Go Back</Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {portalUrl && !error && (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Redirecting to Stripe Customer Portal...
                </p>
                <p className="text-sm text-muted-foreground">
                  If you are not redirected automatically,{" "}
                  <a
                    href={portalUrl}
                    className="text-primary hover:underline"
                  >
                    click here
                  </a>
                  .
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

