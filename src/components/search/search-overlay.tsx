"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Factory,
  Loader2,
  Package,
  Tag,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/features/search/hooks/use-search";
import type {
  CustomerResult,
  FactoryOrderResult,
  FactoryResult,
  OrderResult,
  ProductResult,
} from "@/features/search/api/search";

const ORDER_STATUS: Record<string, string> = {
  pending: "bg-warn-bg text-warn-tx border-warn-tx/30",
  ready: "bg-c50 text-coral-dk border-c100",
  out_for_delivery: "bg-c100 text-coral-dk border-c200",
  delivered: "bg-success-bg text-success-tx border-success-tx/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const ORDER_LABEL: Record<string, string> = {
  pending: "Pending",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const FO_STATUS: Record<string, string> = {
  open: "bg-c50 text-coral-dk border-c100",
  closed: "bg-success-bg text-success-tx border-success-tx/20",
};

interface Props {
  onClose: () => void;
}

export function SearchOverlay({ onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, isLoading, hasResults, isEmpty } = useSearch(query);

  // Focus input on mount, restore scroll on unmount
  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  const totalResults = hasResults
    ? Object.values(results).reduce((s, arr) => s + arr.length, 0)
    : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-[200] flex flex-col bg-background"
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close search"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, customers, products…"
            className="h-9 pr-8"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {isLoading && (
            <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {/* Idle state */}
        {query.trim().length < 2 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search
          </p>
        )}

        {/* Empty state */}
        {isEmpty && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No results for &ldquo;{query.trim()}&rdquo;
          </p>
        )}

        {hasResults && (
          <div className="space-y-5">
            {/* CUSTOMERS */}
            {results.customers.length > 0 && (
              <Section label="Customers" count={results.customers.length}>
                {results.customers.map((c) => (
                  <CustomerRow
                    key={c.id}
                    item={c}
                    onSelect={() => navigate(`/customers/${c.id}`)}
                  />
                ))}
              </Section>
            )}

            {/* ORDERS */}
            {results.orders.length > 0 && (
              <Section label="Orders" count={results.orders.length}>
                {results.orders.map((o) => (
                  <OrderRow
                    key={o.id}
                    item={o}
                    onSelect={() => navigate(`/orders/${o.id}`)}
                  />
                ))}
              </Section>
            )}

            {/* FACTORY ORDERS */}
            {results.factoryOrders.length > 0 && (
              <Section
                label="Factory Orders"
                count={results.factoryOrders.length}
              >
                {results.factoryOrders.map((fo) => (
                  <FactoryOrderRow
                    key={fo.id}
                    item={fo}
                    onSelect={() => navigate(`/factory-orders/${fo.id}`)}
                  />
                ))}
              </Section>
            )}

            {/* FACTORIES */}
            {results.factories.length > 0 && (
              <Section label="Factories" count={results.factories.length}>
                {results.factories.map((f) => (
                  <FactoryRow
                    key={f.id}
                    item={f}
                    onSelect={() => navigate(`/factories/${f.id}`)}
                  />
                ))}
              </Section>
            )}

            {/* PRODUCTS */}
            {results.products.length > 0 && (
              <Section label="Products" count={results.products.length}>
                {results.products.map((p) => (
                  <ProductRow
                    key={p.id}
                    item={p}
                    onSelect={() => navigate(`/products/${p.id}`)}
                  />
                ))}
              </Section>
            )}

            {totalResults >= 6 && (
              <p className="pb-2 text-center text-xs text-muted-foreground">
                Showing top results. Refine your search for more.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Section wrapper ─────────────────────────────────────────────── */

function Section({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        <span className="font-normal normal-case tracking-normal">
          ({count})
        </span>
      </p>
      <ul className="divide-y rounded-xl border">{children}</ul>
    </div>
  );
}

/* ── Result rows ─────────────────────────────────────────────────── */

function ResultRow({
  icon: Icon,
  title,
  sub,
  badge,
  onSelect,
}: {
  icon: React.ElementType;
  title: string;
  sub?: string;
  badge?: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        onClick={onSelect}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent active:bg-accent/80"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          {sub && (
            <p className="truncate text-xs text-muted-foreground">{sub}</p>
          )}
        </div>
        {badge}
      </button>
    </li>
  );
}

function CustomerRow({
  item,
  onSelect,
}: {
  item: CustomerResult;
  onSelect: () => void;
}) {
  return (
    <ResultRow
      icon={User}
      title={item.name}
      sub={item.phone ?? undefined}
      onSelect={onSelect}
    />
  );
}

function OrderRow({
  item,
  onSelect,
}: {
  item: OrderResult;
  onSelect: () => void;
}) {
  const statusClass = ORDER_STATUS[item.status] ?? "";
  const statusLabel = ORDER_LABEL[item.status] ?? item.status;
  return (
    <ResultRow
      icon={Package}
      title={`Order #${item.order_number}`}
      sub={item.customers?.name}
      badge={
        <Badge variant="outline" className={`shrink-0 ${statusClass}`}>
          {statusLabel}
        </Badge>
      }
      onSelect={onSelect}
    />
  );
}

function FactoryOrderRow({
  item,
  onSelect,
}: {
  item: FactoryOrderResult;
  onSelect: () => void;
}) {
  const statusClass = FO_STATUS[item.status] ?? "";
  return (
    <ResultRow
      icon={Factory}
      title={`FO #${item.factory_order_number}`}
      sub={item.factories?.name}
      badge={
        <Badge
          variant="outline"
          className={`shrink-0 capitalize ${statusClass}`}
        >
          {item.status}
        </Badge>
      }
      onSelect={onSelect}
    />
  );
}

function FactoryRow({
  item,
  onSelect,
}: {
  item: FactoryResult;
  onSelect: () => void;
}) {
  return (
    <ResultRow
      icon={Building2}
      title={item.name}
      sub={item.contact ?? undefined}
      onSelect={onSelect}
    />
  );
}

function ProductRow({
  item,
  onSelect,
}: {
  item: ProductResult;
  onSelect: () => void;
}) {
  return <ResultRow icon={Tag} title={item.name} onSelect={onSelect} />;
}
