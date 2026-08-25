"use client";

import React, { useState } from "react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";
import { DiscountTypeSelector } from "@/components/admin/discounts/DiscountTypeSelector";
import { DiscountForm } from "@/components/admin/discounts/DiscountForm";
import type { PromotionType } from "@/lib/services/discount.service";

export default function NewDiscountPage() {
  const [selectedType, setSelectedType] = useState<PromotionType | null>(null);

  return (
    <AdminPageLayout
      title="Create Discount"
      subtitle="Configure coupon codes, Buy X Get Y promotions, or complimentary shipping."
    >
      {!selectedType ? (
        <div className="py-6">
          <DiscountTypeSelector onSelect={(type) => setSelectedType(type)} />
        </div>
      ) : (
        <DiscountForm mode="create" initialType={selectedType} />
      )}
    </AdminPageLayout>
  );
}
