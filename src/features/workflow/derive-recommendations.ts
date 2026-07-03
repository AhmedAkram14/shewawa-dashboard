import { Truck, Package, PackageOpen, ShoppingBag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { TodaySummary } from "@/features/today/api/today";

export type Recommendation = {
  id: string;
  priority: number;
  icon: LucideIcon;
  iconClass: string;
  message: string;
  actionLabel: string;
  href: string;
};

export function deriveRecommendations(summary: TodaySummary): Recommendation[] {
  const recs: Recommendation[] = [];

  if (summary.ready_count > 0) {
    const n = summary.ready_count;
    recs.push({
      id: "create-delivery",
      priority: 1,
      icon: Truck,
      iconClass: "text-primary",
      message: `${n} order${n !== 1 ? "s" : ""} ready for delivery`,
      actionLabel: "Create Delivery",
      href: "/deliveries",
    });
  }

  if (summary.available_stock_count > 0) {
    const n = summary.available_stock_count;
    recs.push({
      id: "allocate-stock",
      priority: 2,
      icon: PackageOpen,
      iconClass: "text-warn-tx",
      message: `${n} stock entr${n !== 1 ? "ies" : "y"} ready to allocate`,
      actionLabel: "View Stock",
      href: "/available-stock",
    });
  }

  if (summary.pending_lines_count > 0) {
    const n = summary.pending_lines_count;
    recs.push({
      id: "send-to-factory",
      priority: 3,
      icon: Package,
      iconClass: "text-coral-dk",
      message: `${n} order line${n !== 1 ? "s" : ""} waiting for production`,
      actionLabel: "Send to Factory",
      href: "/factory-orders",
    });
  }

  if (summary.out_for_delivery_count > 0) {
    const n = summary.out_for_delivery_count;
    recs.push({
      id: "deliveries-in-progress",
      priority: 4,
      icon: ShoppingBag,
      iconClass: "text-coral",
      message: `${n} order${n !== 1 ? "s" : ""} out for delivery`,
      actionLabel: "View Deliveries",
      href: "/deliveries",
    });
  }

  return recs;
}
