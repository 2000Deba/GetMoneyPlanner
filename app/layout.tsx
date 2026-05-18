import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import { Toaster } from 'react-hot-toast';
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f5f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXTAUTH_URL || "https://getmoneyplanner.vercel.app"
  ),
  title: {
    default: "GetMoneyPlanner",
    template: "%s | GetMoneyPlanner",
  },
  description: "Manage your money smarter with GetMoneyPlanner — track income, expenses, budgets, and financial goals all in one place.",
  keywords: [
    "money planner",
    "budget tracker",
    "expense manager",
    "financial goals",
    "personal finance",
    "income tracker",
  ],
  authors: [{ name: "Debasish Seal", url: "https://debasishseal.vercel.app" }],
  creator: "Debasish Seal",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "GetMoneyPlanner",
    title: "GetMoneyPlanner — Smart Personal Finance Manager",
    description:
      "Track income, expenses, budgets and financial goals with GetMoneyPlanner.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GetMoneyPlanner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GetMoneyPlanner — Smart Personal Finance Manager",
    description: "Manage your money smarter with GetMoneyPlanner.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "10px",
              fontSize: "14px",
            },
          }}
        />
        <Providers>
          <div className=" min-h-screen bg-linear-to-br from-slate-100 via-white to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 transition-colors duration-500">
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
