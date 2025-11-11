import { Database } from "@/types/supabase";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { isAuthApiError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/overview/videos";

  // Handle errors from Supabase
  if (error) {
    console.error("[auth/callback] Error from Supabase:", {
      error,
      error_description,
    });
    return NextResponse.redirect(
      `${requestUrl.origin}/login/failed?err=${encodeURIComponent(error)}&desc=${encodeURIComponent(error_description || "")}`
    );
  }

  // If no code parameter, check if user is already authenticated
  if (!code) {
    console.warn("[auth/callback] No code parameter in callback URL");
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // User is already authenticated, redirect to overview
      return NextResponse.redirect(`${requestUrl.origin}/overview/videos`);
    } else {
      // No code and no user, redirect to login
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`);
    }
  }

  // Exchange code for session
  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[auth/callback] Error exchanging code for session:", exchangeError);
      return NextResponse.redirect(
        `${requestUrl.origin}/login/failed?err=${encodeURIComponent(exchangeError.message)}`
      );
    }

    // Verify the user session was created
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[auth/callback] Error getting user after exchange:", userError);
      return NextResponse.redirect(
        `${requestUrl.origin}/login/failed?err=session_not_created`
      );
    }

    console.log("[auth/callback] Successfully authenticated user:", user.id);

    // Ensure user has a credits record (create if doesn't exist)
    const { data: creditsData, error: creditsError } = await supabase
      .from("credits")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (creditsError && creditsError.code === "PGRST116") {
      // No credits record found, create one
      const { error: createCreditsError } = await supabase
        .from("credits")
        .insert({
          user_id: user.id,
          credits: 0,
        });

      if (createCreditsError) {
        console.error("[auth/callback] Error creating credits record:", createCreditsError);
        // Don't fail the login, just log the error
      }
    }

    // Redirect to the intended destination or overview
    const redirectUrl = next.startsWith("/") 
      ? `${requestUrl.origin}${next}`
      : `${requestUrl.origin}/overview/videos`;

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error("[auth/callback] Unexpected error:", error);
    
    if (isAuthApiError(error)) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login/failed?err=${encodeURIComponent(error.message)}`
      );
    }

    return NextResponse.redirect(
      `${requestUrl.origin}/login/failed?err=unexpected_error`
    );
  }
}
