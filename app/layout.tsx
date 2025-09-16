import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Emotional Dial Tester",
  description: "Real-time emotional response tracking tool",
  generator: "v0.app",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Emotional Dial Tester",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "theme-color": "#6366f1",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""

  return (
    <html lang="en" className="antialiased">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="touch-manipulation">
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </Suspense>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log("[v0] Setting up environment variables...");
              console.log("[v0] SUPABASE_URL from env:", "${supabaseUrl}");
              console.log("[v0] SUPABASE_ANON_KEY from env:", "${supabaseAnonKey ? "***" + supabaseAnonKey.slice(-4) : "missing"}");
              
              window.SUPABASE_URL = "${supabaseUrl}";
              window.SUPABASE_ANON_KEY = "${supabaseAnonKey}";
              
              console.log("[v0] Window variables set:", {
                url: window.SUPABASE_URL,
                key: window.SUPABASE_ANON_KEY ? "***" + window.SUPABASE_ANON_KEY.slice(-4) : "missing"
              });

              document.addEventListener('touchstart', function() {}, {passive: true});
              
              document.body.style.overscrollBehavior = 'none';
              
              document.addEventListener('selectstart', function(e) {
                if (e.target.closest('.touch-none')) {
                  e.preventDefault();
                }
              });
            `,
          }}
        />
      </body>
    </html>
  )
}
