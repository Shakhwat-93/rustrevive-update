import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Rust & Revive",
    default: "Rust & Revive — Vintage-Inspired Fashion & Editorial Goods",
  },
  description: "Curated vintage-inspired garments, raw denim, leather goods, and timeless outerwear. Built for the everyday.",
  metadataBase: new URL(process.env["NEXT_PUBLIC_SITE_URL"] || "https://rustrevive.store"),
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rustrevive.store",
    siteName: "Rust & Revive",
    title: "Rust & Revive — Vintage-Inspired Fashion",
    description: "Curated vintage-inspired garments, raw denim, leather goods, and timeless outerwear. Built for the everyday.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0d0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full bg-[#0e0d0c] text-[#fbf9f5]`}
    >
      <body className="min-h-full flex flex-col antialiased selection:bg-[#9e472a] selection:text-white bg-[#0e0d0c] text-[#fbf9f5]">
        {children}
      </body>
    </html>
  );
}
