"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAllOrders } from "../hooks/use-orders";
import type { OrderWithListingInfo } from "../api/orders";

type ListingGroup = {
  listingId: string;
  listingStatus: string;
  productName: string;
  activeCount: number;
  totalPieces: number;
};

function groupByListing(orders: OrderWithListingInfo[]): ListingGroup[] {
  const map = new Map<string, ListingGroup>();

  for (const order of orders) {
    const { id, status, products } = order.listings;
    if (!map.has(id)) {
      map.set(id, {
        listingId: id,
        listingStatus: status,
        productName: products.name,
        activeCount: 0,
        totalPieces: 0,
      });
    }
    if (order.status === "active") {
      const g = map.get(id)!;
      g.activeCount += 1;
      g.totalPieces += order.quantity;
    }
  }

  return Array.from(map.values());
}

export function OrdersView() {
  const { data: orders = [], isLoading, error } = useAllOrders();

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        {error instanceof Error ? error.message : "Failed to load orders."}
      </div>
    );
  }

  const groups = groupByListing(orders);
  const totalActive = orders.filter((o) => o.status === "active").length;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Orders
          {totalActive > 0 && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({totalActive} active)
            </span>
          )}
        </h1>
      </div>

      {groups.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          No orders yet. Open a listing to add orders.
        </p>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <Link key={g.listingId} href={`/listings/${g.listingId}`}>
              <Card className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{g.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {g.activeCount} {g.activeCount === 1 ? "order" : "orders"}{" "}
                      · {g.totalPieces} pcs
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 capitalize text-xs"
                  >
                    {g.listingStatus.replace(/_/g, " ")}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
