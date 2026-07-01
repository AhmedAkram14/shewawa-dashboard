"use client";

import { CalendarDays, Grid2x2, Plus, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/more", label: "More", icon: Grid2x2 },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/today") return pathname === "/today" || pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background safe-area-pb">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end">
        {/* Today */}
        <NavItem
          href={NAV_ITEMS[0].href}
          label={NAV_ITEMS[0].label}
          icon={NAV_ITEMS[0].icon}
          active={isActive(NAV_ITEMS[0].href)}
        />
        {/* Orders */}
        <NavItem
          href={NAV_ITEMS[1].href}
          label={NAV_ITEMS[1].label}
          icon={NAV_ITEMS[1].icon}
          active={isActive(NAV_ITEMS[1].href)}
        />

        {/* Center: + New Order */}
        <div className="flex justify-center py-2">
          <Link
            href="/listings"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-opacity hover:opacity-90 active:opacity-75"
            aria-label="New Order"
          >
            <Plus className="h-6 w-6" />
          </Link>
        </div>

        {/* Customers */}
        <NavItem
          href={NAV_ITEMS[2].href}
          label={NAV_ITEMS[2].label}
          icon={NAV_ITEMS[2].icon}
          active={isActive(NAV_ITEMS[2].href)}
        />
        {/* More */}
        <NavItem
          href={NAV_ITEMS[3].href}
          label={NAV_ITEMS[3].label}
          icon={NAV_ITEMS[3].icon}
          active={isActive(NAV_ITEMS[3].href)}
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
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
