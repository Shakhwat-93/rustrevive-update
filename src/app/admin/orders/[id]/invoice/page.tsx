import React from "react";
import { notFound } from "next/navigation";
import { OrderService } from "@/lib/services/order.service";
import { mapOrderToInvoiceData } from "@/lib/invoice/invoice-mapper";
import { InvoiceViewer } from "@/components/invoice/InvoiceViewer";
import type { InvoiceFormat } from "@/types/invoice.types";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ format?: string; autoprint?: string }>;
}

export default async function OrderInvoicePage(props: PageProps) {
  const { id } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};

  let order;
  try {
    order = await OrderService.getOrderById(id);
  } catch {
    notFound();
  }

  if (!order) {
    notFound();
  }

  const invoiceData = mapOrderToInvoiceData(order);
  const initialFormat = (searchParams.format as InvoiceFormat) || "a4";

  return <InvoiceViewer data={invoiceData} initialFormat={initialFormat} />;
}
