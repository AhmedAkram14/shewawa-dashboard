import {
  BadgeCheck,
  Building2,
  DollarSign,
  Package,
  PackageCheck,
  Settings,
  ShoppingCart,
  Tag,
} from "lucide-react";
import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "More — SHE WAWA",
};

const LINKS = [
  { href: "/listings", label: "Listings", icon: Tag },
  { href: "/factory-orders", label: "Factory Orders", icon: ShoppingCart },
  { href: "/deliveries", label: "Deliveries", icon: Package },
  { href: "/available-stock", label: "Available Stock", icon: PackageCheck },
  { href: "/collections", label: "Collections", icon: BadgeCheck },
  { href: "/factories", label: "Factories", icon: Building2 },
  { href: "/money", label: "Money", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export default function MorePage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-xl font-semibold">More</h1>

      <div className="grid grid-cols-2 gap-3">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-start gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-accent active:bg-accent/80"
          >
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
