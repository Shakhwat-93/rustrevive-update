import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ValidationError } from "@/lib/errors/app-error";
import type { CampaignType, CampaignStatus } from "@/types/database.types";

export class MarketingService {
  public static async listCampaigns() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list campaigns: ${error.message}`);
    }

    return data || [];
  }

  public static async createCampaign(input: {
    name: string;
    type: CampaignType;
    status?: CampaignStatus;
    target_type?: string;
    target_id?: string;
    starts_at?: string;
    ends_at?: string;
    budget?: number;
  }) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("marketing_campaigns")
      .insert({
        name: input.name.trim(),
        type: input.type,
        status: input.status || "DRAFT",
        target_type: input.target_type || "ALL",
        target_id: input.target_id || null,
        starts_at: input.starts_at || null,
        ends_at: input.ends_at || null,
        budget: input.budget || 0,
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to create campaign: ${error?.message}`);
    }

    return data;
  }

  public static async listCustomerSegments() {
    const supabase = createAdminClient();
    const { data } = await supabase.from("customer_segments").select("*").order("created_at", { ascending: true });
    return data || [];
  }
}
