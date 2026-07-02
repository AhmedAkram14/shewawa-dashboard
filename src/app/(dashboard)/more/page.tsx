import type { Metadata } from "next";
import {
  Building2,
  Package,
  PackageCheck,
  Settings,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = { title: "More — SHE WAWA" };

const LINKS = [
  { href: "/products", label: "Products", icon: PackageCheck },
  { href: "/factories", label: "Factories", icon: Building2 },
  { href: "/factory-orders", label: "Factory Orders", icon: ShoppingCart },
  { href: "/deliveries", label: "Deliveries", icon: Package },
  { href: "/available-stock", label: "Available Stock", icon: PackageCheck },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export default function MorePage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-24">
      <h1 className="text-2xl font-semibold leading-tight">More</h1>

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

      <SignOutButton />
    </div>
  );
}
