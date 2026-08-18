"use client";

import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function CommunitySection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="w-full py-16 md:py-28 px-4 sm:px-6 lg:px-12 bg-[#0e0d0c]">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          {/* Headline */}
          <div className="lg:col-span-7 space-y-3">
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif-editorial uppercase tracking-tight text-[#fbf9f5]">
              STAY IN THE LOOP
            </h2>
            <p className="text-xs sm:text-sm font-sans-ui text-[#9c9689]">
              Sign up for private seasonal releases and stories.
            </p>
          </div>

          {/* Form & Social */}
          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={handleSubscribe} className="relative flex items-center border-b border-[#262421] focus-within:border-[#9e472a] pb-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address..."
                className="w-full bg-transparent text-sm text-[#fbf9f5] placeholder-[#666258] font-sans-ui py-2 focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 py-1 text-[#9e472a] hover:text-[#fbf9f5] transition-colors cursor-pointer"
                aria-label="Subscribe"
              >
                {subscribed ? <Check className="w-4 h-4 text-emerald-500" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="flex space-x-6 text-xs font-mono-meta uppercase tracking-wider text-[#9c9689]">
              <a href="https://instagram.com/rustrevive" target="_blank" rel="noopener noreferrer" className="hover:text-[#9e472a] transition-colors">
                Instagram →
              </a>
              <a href="https://facebook.com/rustrevive" target="_blank" rel="noopener noreferrer" className="hover:text-[#9e472a] transition-colors">
                Facebook →
              </a>
              <a href="https://tiktok.com/@rustrevive" target="_blank" rel="noopener noreferrer" className="hover:text-[#9e472a] transition-colors">
                TikTok →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
