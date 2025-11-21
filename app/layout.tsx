import { Fredoka } from "next/font/google";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { Suspense } from "react";
import AnnouncementBar from "@/components/homepage/announcement-bar"
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/homepage/theme-provider"
import { validateConfig } from "@/lib/config";

import { PetAvatar } from "@/components/ui/pet-avatar";
import { MobileAvatars } from "@/components/ui/mobile-avatars";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

// Validate configuration at app initialization
validateConfig();

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover', // Allows content to extend into safe areas on iOS
};

export const metadata = {
  title: "PetGroove - Pet Dancing Videos with AI",
  description: "Turn your pet into a dancing superstar! Create amazing dancing videos of your pet using AI in minutes.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon-32x32.png",
  },
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
        className={`
          ${fredoka.className}
          min-h-screen
          flex flex-col
          bg-gradient-to-br
          from-purple-100
          via-pink-100
          to-blue-100
          text-foreground
          antialiased
          safe-area-inset-top
        `}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {/* Mobile-only decorative avatars - conditionally rendered */}
        <MobileAvatars />

        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
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
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
