import type { ListingWithRelations } from "../api/listings";
import { OrderList } from "@/features/orders/components/order-list";
import { OrderSummary } from "@/features/orders/components/order-summary";
import { FactoryOrderInfo } from "@/features/factory-orders/components/factory-order-info";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Placeholder({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

export function ListingStageView({
  listing,
}: {
  listing: ListingWithRelations;
}) {
  switch (listing.status) {
    case "collecting":
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Collecting orders until{" "}
            <span className="font-medium text-foreground">
              {formatDate(listing.closes_on)}
            </span>
            .
          </p>
          <OrderList listing={listing} />
        </div>
      );

    case "decision":
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            Collecting ended. Review orders and choose an action below.
          </p>
          <OrderSummary listing={listing} />
        </div>
      );

    case "ordered":
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            A factory order has been placed for this listing.
          </p>
          {listing.factory_order_id ? (
            <FactoryOrderInfo factoryOrderId={listing.factory_order_id} />
          ) : (
            <Placeholder text="Factory order not yet assigned." />
          )}
        </div>
      );

    case "receiving":
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Goods are being received from the factory.
          </p>
          <Placeholder text="Delivery tracking — available when Deliveries are implemented" />
        </div>
      );

    case "ready_for_packing":
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            All goods received. Ready to pack and distribute to customers.
          </p>
          <Placeholder text="Packing summary — available in a future phase" />
        </div>
      );

    case "reconciled":
      return (
        <p className="text-sm text-muted-foreground">
          This listing has been fully reconciled and is now complete.
        </p>
      );

    case "cancelled":
      return (
        <p className="text-sm text-muted-foreground">
          This listing was cancelled at the decision stage and will not proceed
          to a factory order.
        </p>
      );
  }
}
