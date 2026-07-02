import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { ProfilesProvider } from "@/lib/profiles";
import { LogSheetProvider } from "@/components/LogSheet";
import { BottomNav } from "@/components/BottomNav";

const romie = localFont({
  src: "./fonts/Romie-Regular.woff2",
  weight: "400",
  variable: "--font-romie",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Autumn & Alma — first foods",
  description:
    "A calm, simple way to introduce solids to Autumn and Alma, and track their days.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "First Foods",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3ecdf",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${romie.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>
          <ProfilesProvider>
            <StoreProvider>
              <LogSheetProvider>
                <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
                  <main className="flex-1 px-5 pb-32 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
                    {children}
                  </main>
                  <BottomNav />
                </div>
              </LogSheetProvider>
            </StoreProvider>
          </ProfilesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
