import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, Space_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stoopsale.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "StoopSale — garage, stoop & yard sales near you",
    template: "%s · StoopSale",
  },
  description:
    "Find garage sales, stoop sales, yard sales, and free stuff happening near you — open now, on a map. List your own in a minute.",
  keywords: [
    "garage sales near me", "stoop sale", "yard sales this weekend",
    "estate sales", "free stuff", "moving sale",
  ],
  openGraph: {
    siteName: "StoopSale",
    type: "website",
    title: "StoopSale — garage, stoop & yard sales near you",
    description: "Sales near you, on a map. Open now, this weekend, and free stuff.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f3ec",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
