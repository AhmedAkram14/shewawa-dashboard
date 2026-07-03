import type { Metadata } from "next";
import Link from "next/link";
import {
  Package,
  CheckCircle2,
  Truck,
  PackageCheck,
  Factory,
  Banknote,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { getTodaySummary } from "@/features/today/api/today";
import type { TodaySummary } from "@/features/today/api/today";

export const metadata: Metadata = { title: "Today — SHE WAWA" };

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  href?: string;
  accent?: string;
}) {
  const inner = (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm active:scale-[0.98] transition-transform">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-5 w-5 ${accent ?? "text-muted-foreground/60"}`} />
      </div>
      <div>
        <p className="text-3xl font-bold leading-none tracking-tight">
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

export default async function TodayPage() {
  const supabase = await createClient();

  let summary: TodaySummary | null = null;
  let fetchError: string | null = null;

  try {
    summary = await getTodaySummary(supabase);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load summary";
  }

  const today = new Date().toLocaleDateString("en-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-semibold leading-tight">Today</h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      {fetchError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {fetchError}
        </p>
      ) : summary ? (
        <>
          {/* Order pipeline */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Order Pipeline
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard
                label="Pending"
                value={summary.pending_count}
                icon={Package}
                href="/orders"
                accent="text-yellow-500"
              />
              <KpiCard
                label="Ready for Delivery"
                value={summary.ready_count}
                icon={CheckCircle2}
                href="/orders"
                accent="text-blue-500"
              />
              <KpiCard
                label="Out for Delivery"
                value={summary.out_for_delivery_count}
                icon={Truck}
                href="/deliveries"
                accent="text-orange-500"
              />
              <KpiCard
                label="Delivered Today"
                value={summary.delivered_today_count}
                icon={PackageCheck}
                href="/orders"
                accent="text-green-500"
              />
            </div>
          </section>

          {/* Factory + stock */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Factory
            </h2>
            <KpiCard
              label="Pieces at Factory"
              value={summary.pieces_at_factory}
              sub="units currently in production"
              icon={Factory}
              href="/factory-orders"
              accent="text-purple-500"
            />
          </section>

          {/* Financials */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Financials — Active Orders
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard
                label="Total Value"
                value={`EGP ${formatPrice(summary.total_active_value)}`}
                sub="gross value of active orders"
                icon={Banknote}
                accent="text-muted-foreground/60"
              />
              <KpiCard
                label="Deposits Collected"
                value={`EGP ${formatPrice(summary.deposits_on_active)}`}
                sub="paid so far"
                icon={Banknote}
                accent="text-green-500"
              />
            </div>
            <div className="mt-3">
              <KpiCard
                label="Outstanding Balance"
                value={`EGP ${formatPrice(summary.outstanding_balance)}`}
                sub="balance still owed by customers"
                icon={Banknote}
                accent="text-red-500"
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
