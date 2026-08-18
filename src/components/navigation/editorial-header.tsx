"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const NAV_ITEMS = [
  { label: "HOME", href: "/" },
  { label: "SHOP", href: "/collections/all" },
  { label: "MEN", href: "/collections/men" },
  { label: "WOMEN", href: "/collections/women" },
  { label: "PANTS", href: "/collections/pants" },
  { label: "T-SHIRTS", href: "/collections/t-shirts" },
  { label: "BELTS", href: "/collections/belts" },
  { label: "JACKETS", href: "/collections/jackets" },
  { label: "ABOUT", href: "/about" },
];

export function EditorialHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 bg-[#fbf9f5] transition-all duration-300 ${
          isScrolled
            ? "py-4 border-b border-[#ded7c8] bg-[#fbf9f5]/98 backdrop-blur-sm"
            : "py-5 md:py-6 border-b border-[#e8e2d5]"
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
          {/* LEFT: Logo */}
          <div className="flex-shrink-0">
            <Logo variant="light" size="md" />
          </div>

          {/* CENTER: Minimal Navigation */}
          <nav className="hidden lg:flex items-center space-x-7 xl:space-x-8">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-[11px] font-mono-meta uppercase tracking-[0.18em] transition-colors duration-200 ${
                    isActive
                      ? "text-[#9e472a] font-semibold"
                      : "text-[#2e2c2a] hover:text-[#9e472a]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Search, Account, Bag */}
          <div className="flex items-center space-x-5 text-[#141312]">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-1 text-[#2e2c2a] hover:text-[#9e472a] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            <Link
              href="/account"
              className="hidden sm:block p-1 text-[#2e2c2a] hover:text-[#9e472a] transition-colors"
              aria-label="Account"
            >
              <User className="w-4 h-4" />
            </Link>

            <Link
              href="/cart"
              className="flex items-center space-x-1.5 p-1 text-[#141312] hover:text-[#9e472a] transition-colors"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-[11px] font-mono-meta uppercase tracking-wider">
                BAG <span className="text-[#9e472a]">(0)</span>
              </span>
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1 text-[#141312] hover:text-[#9e472a] transition-colors cursor-pointer"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expandable Minimal Search Overlay */}
        {searchOpen && (
          <div className="border-t border-[#ded7c8] bg-[#fbf9f5] py-4 px-4 sm:px-6 lg:px-12 animate-in fade-in duration-200">
            <div className="max-w-2xl mx-auto flex items-center border-b border-[#141312] pb-2">
              <Search className="w-4 h-4 text-[#5c574e] mr-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search raw denim, tees, jackets..."
                className="w-full bg-transparent text-sm text-[#141312] placeholder-[#8c8577] font-sans-ui focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs font-mono-meta uppercase tracking-wider text-[#5c574e] hover:text-[#141312] ml-3 cursor-pointer"
              >
                ESC
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-[#0e0d0c]/60 backdrop-blur-xs"
          />

          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-[#fbf9f5] border-l border-[#ded7c8] p-6 flex flex-col justify-between shadow-xl z-10 animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#ded7c8]">
                <Logo variant="light" size="sm" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-[#5c574e] hover:text-[#141312] cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-3 pt-2">
                <ul className="space-y-2">
                  {NAV_ITEMS.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block font-serif-editorial text-2xl uppercase tracking-tight text-[#141312] hover:text-[#9e472a] transition-colors py-1"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="space-y-3 pt-6 border-t border-[#ded7c8] text-xs font-mono-meta text-[#5c574e]">
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="block hover:text-[#141312]"
              >
                ACCOUNT LOGIN
              </Link>
              <div className="text-[10px] uppercase tracking-widest text-[#8c8577]">
                &copy; {new Date().getFullYear()} RUST &amp; REVIVE
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
