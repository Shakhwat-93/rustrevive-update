"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Check, Send } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate inquiry recording
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-2.5 pt-4">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Client Support
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-wider text-[#141312]">
              Contact The Studio
            </h1>
            <p className="text-xs sm:text-sm font-sans-ui text-[#5c574e] max-w-md mx-auto">
              For order inquiries, bespoke sizing guidance, or showroom appointments in Dhaka.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pt-4">
            {/* Contact Details (5 Cols) */}
            <div className="md:col-span-5 space-y-6">
              <div className="bg-white border border-[#ded7c8] p-6 space-y-5 shadow-xs">
                <div className="flex items-start space-x-3.5">
                  <MapPin className="w-5 h-5 text-[#9e472a] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs font-sans-ui">
                    <p className="font-mono-meta uppercase font-bold text-[#141312]">Design Studio</p>
                    <p className="text-[#5c574e]">Banani / Gulshan Hub, Dhaka, Bangladesh</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <Mail className="w-5 h-5 text-[#9e472a] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs font-sans-ui">
                    <p className="font-mono-meta uppercase font-bold text-[#141312]">Electronic Mail</p>
                    <p className="text-[#5c574e]">support@rustrevive.store</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <Phone className="w-5 h-5 text-[#9e472a] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs font-sans-ui">
                    <p className="font-mono-meta uppercase font-bold text-[#141312]">Direct Hotline</p>
                    <p className="text-[#5c574e]">+880 1700-000000 (Sat &ndash; Thu, 10 AM &ndash; 7 PM)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Form (7 Cols) */}
            <div className="md:col-span-7">
              <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 shadow-xs">
                {submitted ? (
                  <div className="py-12 text-center space-y-3 text-emerald-700">
                    <Check className="w-8 h-8 mx-auto text-emerald-600" />
                    <h3 className="font-serif text-lg uppercase tracking-wider text-[#141312]">
                      Inquiry Received
                    </h3>
                    <p className="text-xs font-sans-ui text-[#5c574e] max-w-xs mx-auto">
                      Thank you. A specialist from our concierge team will respond within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono-meta">
                    <div>
                      <label className="block text-[#141312] font-semibold mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Tanvir Ahmed"
                        className="w-full p-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#141312] font-semibold mb-1">Email Address *</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. tanvir@example.com"
                          className="w-full p-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[#141312] font-semibold mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="017XXXXXXXX"
                          className="w-full p-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#141312] font-semibold mb-1">Message / Order Query *</label>
                      <textarea
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please describe your garment inquiry or order details..."
                        className="w-full p-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? "Transmitting..." : "Send Message"}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
