import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  auth_user_id?: string;
}

export interface CustomerAddressInput {
  customer_id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  area?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
}

export class CustomerService {
  /**
   * Find existing customer by phone number or create new guest customer record
   */
  public static async findOrCreateCustomer(input: CreateCustomerInput) {
    const supabase = createAdminClient();
    const cleanPhone = input.phone.trim().replace(/[^0-9+]/g, "");

    // 1. Check existing customer
    const { data: existing } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", cleanPhone)
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Update email/name if missing
      if ((!existing.email && input.email) || (!existing.auth_user_id && input.auth_user_id)) {
        const { data: updated } = await supabase
          .from("customers")
          .update({
            email: input.email || existing.email,
            auth_user_id: input.auth_user_id || existing.auth_user_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        return updated || existing;
      }
      return existing;
    }

    // 2. Create new customer
    const { data: created, error } = await supabase
      .from("customers")
      .insert({
        name: input.name.trim(),
        phone: cleanPhone,
        email: input.email?.trim() || null,
        auth_user_id: input.auth_user_id || null,
      })
      .select()
      .single();

    if (error || !created) {
      logger.error("Failed to create customer record", error, "CustomerService");
      throw new Error(`Customer creation error: ${error?.message}`);
    }

    return created;
  }

  /**
   * Save customer address snapshot to address book
   */
  public static async saveCustomerAddress(input: CustomerAddressInput) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: input.customer_id,
        full_name: input.full_name,
        phone: input.phone,
        address_line_1: input.address_line_1,
        address_line_2: input.address_line_2 || null,
        city: input.city,
        area: input.area || null,
        postal_code: input.postal_code || null,
        country: input.country || "Bangladesh",
        is_default: input.is_default || false,
      })
      .select()
      .single();

    if (error) {
      logger.warn("Failed to persist address to address book", "CustomerService", { error });
      return null;
    }

    return data;
  }
}
