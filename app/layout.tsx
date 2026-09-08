import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "P2P Router | Complete routes across Binance P2P",
  alternates: { canonical: "/" },
  description: "Choose a country, direction and crypto amount. P2P Router finds complete routes across real Binance P2P merchants.",
  openGraph: {
    title: "P2P Router | Complete routes across Binance P2P",
    description: "Find the best route for your whole P2P amount using live Binance market data.",
    type: "website",
    images: [{ url: "/images/p2p-route-hero.webp", width: 1672, height: 941, alt: "P2P Router route map" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "P2P Router | Complete routes across Binance P2P",
    description: "Find the best route for your whole P2P amount using live Binance market data.",
    images: ["/images/p2p-route-hero.webp"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
