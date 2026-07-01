"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { SearchResultKind } from "../api/search";
import { useSearch } from "../hooks/use-search";

const CATEGORIES: { kind: SearchResultKind; label: string }[] = [
  { kind: "customer", label: "Customers" },
  { kind: "product", label: "Products" },
  { kind: "listing", label: "Listings" },
  { kind: "factory_order", label: "Factory Orders" },
  { kind: "delivery", label: "Deliveries" },
];

export function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const { data: results = [], isLoading } = useSearch(query);

  // Clear query when closed
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setQuery(""), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Search input row */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customers, products, deliveries…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          aria-label="Close search"
          onClick={() => {
            setQuery("");
            onClose();
          }}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {query.length < 2 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search.
          </p>
        ) : isLoading ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Searching…
          </p>
        ) : results.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No results for &quot;{query}&quot;.
          </p>
        ) : (
          CATEGORIES.map((cat) => {
            const items = results.filter((r) => r.kind === cat.kind);
            if (items.length === 0) return null;
            return (
              <div key={cat.kind}>
                <div className="sticky top-0 bg-muted/60 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                  {cat.label}
                </div>
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className="flex flex-col border-b px-4 py-3 hover:bg-accent active:bg-accent/80"
                  >
                    <span className="text-sm font-medium">{item.title}</span>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
