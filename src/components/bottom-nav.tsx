"use client";

import { CalendarDays, Grid2x2, Plus, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/today") return pathname === "/today" || pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background safe-area-pb">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end">
        <NavItem
          href="/today"
          label="Today"
          icon={CalendarDays}
          active={isActive("/today")}
        />
        <NavItem
          href="/orders"
          label="Orders"
          icon={ShoppingBag}
          active={isActive("/orders")}
        />

        {/* Centre FAB */}
        <Link
          href="/orders/new"
          className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Plus className="h-5 w-5" />
          </span>
          <span>New Order</span>
        </Link>

        <NavItem
          href="/customers"
          label="Customers"
          icon={Users}
          active={isActive("/customers")}
        />
        <NavItem
          href="/more"
          label="More"
          icon={Grid2x2}
          active={isActive("/more")}
        />
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
        active
          ? "text-foreground font-semibold"
          : "text-ink4 hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
