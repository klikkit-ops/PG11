import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { Suspense } from "react";
import AnnouncementBar from "@/components/homepage/announcement-bar"
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/homepage/theme-provider"
import { validateConfig } from "@/lib/config";

// Validate configuration at app initialization
validateConfig();

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  title: "PetGroove - Pet Dancing Videos with AI",
  description: "Turn your pet into a dancing superstar! Create amazing dancing videos of your pet using AI in minutes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Apply PetGroove theme at the document level
    <html lang="en" suppressHydrationWarning data-theme="petgroove">
      {/* Use gradient background with daisyUI base tokens for consistent theming */}
      <body
        className="
          min-h-screen
          flex flex-col
          bg-gradient-to-b
          from-[#F3F1FF]
          via-[#FDF2FF]
          to-[#F9FAFB]
          text-base-content
        "
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AnnouncementBar />
          {/* Remove the section wrapper as it's interfering with sticky positioning */}
          <Suspense
            fallback={
              <div className="sticky top-0 z-50 w-full border-b bg-base-100/95 backdrop-blur supports-[backdrop-filter]:bg-base-100/60">
                <div className="container h-16" />
              </div>
            }
          >
            <Navbar />
          </Suspense>
          <main className="flex-1">
            {children}
          </main>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
