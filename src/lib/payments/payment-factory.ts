import type { IPaymentProvider } from "./provider.interface";
import { CODProvider } from "./providers/cod.provider";
import { SSLCommerzProvider } from "./providers/sslcommerz.provider";
import { BkashProvider } from "./providers/bkash.provider";
import { NagadProvider } from "./providers/nagad.provider";
import { StripeProvider } from "./providers/stripe.provider";

export class PaymentFactory {
  private static providers: Map<string, IPaymentProvider> = new Map<string, IPaymentProvider>([
    ["COD", new CODProvider()],
    ["CASH_ON_DELIVERY", new CODProvider()],
    ["SSL_COMMERZ", new SSLCommerzProvider()],
    ["BKASH", new BkashProvider()],
    ["NAGAD", new NagadProvider()],
    ["STRIPE", new StripeProvider()],
  ]);

  public static getProvider(code: string = "COD"): IPaymentProvider {
    const normalized = code.toUpperCase().trim();
    const provider = this.providers.get(normalized);
    if (!provider) {
      return this.providers.get("COD")!;
    }
    return provider;
  }

  public static listAvailableProviders(): { code: string; name: string }[] {
    return [
      { code: "COD", name: "Cash on Delivery" },
      { code: "SSL_COMMERZ", name: "SSLCommerz (Cards / Mobile Banking)" },
      { code: "BKASH", name: "bKash Direct Pay" },
      { code: "NAGAD", name: "Nagad Online" },
      { code: "STRIPE", name: "Stripe International" },
    ];
  }
}
