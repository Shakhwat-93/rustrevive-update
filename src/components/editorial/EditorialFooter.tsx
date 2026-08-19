import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function EditorialFooter() {
  const shopLinks = [
    { label: "All Products", href: "/collections/all" },
    { label: "Pants & Denim", href: "/collections/pants" },
    { label: "Heavyweight T-Shirts", href: "/collections/t-shirts" },
    { label: "Leather Belts", href: "/collections/belts" },
    { label: "Jackets & Outerwear", href: "/collections/jackets" },
  ];

  const helpLinks = [
    { label: "Contact", href: "/contact" },
    { label: "Shipping Policy", href: "/shipping" },
    { label: "Refund & Exchange", href: "/refunds" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
  ];

  return (
    <footer className="w-full bg-[#fbf9f5] text-[#141312] pt-14 pb-10 px-4 sm:px-6 lg:px-12 border-t border-[#ded7c8]">
      <div className="max-w-[1600px] mx-auto space-y-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Column (4 Cols) */}
          <div className="md:col-span-4 space-y-3">
            <Logo variant="light" size="md" />
            <p className="text-xs font-sans-ui text-[#5c574e] max-w-xs leading-relaxed">
              Timeless garments crafted from raw denim, heavy cotton, and vegetable-tanned leather.
            </p>
          </div>

          {/* SHOP COLUMN (3 Cols) */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.2em] text-[#141312] font-semibold block">
              SHOP
            </span>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs font-sans-ui text-[#5c574e] hover:text-[#9e472a] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* HELP COLUMN (3 Cols) */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.2em] text-[#141312] font-semibold block">
              HELP
            </span>
            <ul className="space-y-2">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs font-sans-ui text-[#5c574e] hover:text-[#9e472a] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT COLUMN (2 Cols) */}
          <div className="md:col-span-2 space-y-3">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.2em] text-[#141312] font-semibold block">
              CONTACT
            </span>
            <div className="space-y-1 text-xs font-sans-ui text-[#5c574e]">
              <p>Dhaka, Bangladesh</p>
              <p>support@rustrevive.store</p>
            </div>
          </div>
        </div>

        {/* Bottom Minimal Copyright */}
        <div className="pt-6 border-t border-[#ded7c8] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono-meta uppercase tracking-wider text-[#8c8577]">
          <p suppressHydrationWarning>© {new Date().getFullYear()} Rust &amp; Revive</p>
          <p>BDT (৳)</p>
        </div>
      </div>
    </footer>
  );
}
