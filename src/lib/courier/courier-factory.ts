import type { ICourierProvider } from "./provider.interface";
import { CustomProvider } from "./providers/custom.provider";
import { SteadfastProvider } from "./providers/steadfast.provider";
import { PathaoProvider } from "./providers/pathao.provider";
import { RedxProvider } from "./providers/redx.provider";

export class CourierFactory {
  private static providers: Map<string, ICourierProvider> = new Map<string, ICourierProvider>([
    ["CUSTOM", new CustomProvider()],
    ["STEADFAST", new SteadfastProvider()],
    ["PATHAO", new PathaoProvider()],
    ["REDX", new RedxProvider()],
  ]);

  /**
   * Get specific courier provider by code
   */
  public static getProvider(code: string = "CUSTOM"): ICourierProvider {
    const normalized = code.toUpperCase().trim();
    const provider = this.providers.get(normalized);
    if (!provider) {
      // Fallback to custom in-house provider
      return this.providers.get("CUSTOM")!;
    }
    return provider;
  }

  /**
   * Get list of all supported provider metadata
   */
  public static listAvailableProviders(): { code: string; name: string }[] {
    return Array.from(this.providers.values()).map((p) => ({
      code: p.code,
      name: p.name,
    }));
  }
}
