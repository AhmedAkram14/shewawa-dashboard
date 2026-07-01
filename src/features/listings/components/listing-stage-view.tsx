import type { ListingWithRelations } from "../api/listings";

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
          {listing.threshold && (
            <p className="text-sm text-muted-foreground">
              Minimum threshold:{" "}
              <span className="font-medium text-foreground">
                {listing.threshold} orders
              </span>
            </p>
          )}
          <Placeholder text="Order list — available when Orders are implemented" />
        </div>
      );

    case "decision":
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            Collecting ended. Review orders and choose an action below.
          </p>
          {listing.threshold && (
            <p className="text-sm text-muted-foreground">
              Threshold was{" "}
              <span className="font-medium text-foreground">
                {listing.threshold} orders
              </span>
            </p>
          )}
          <Placeholder text="Order summary — available when Orders are implemented" />
        </div>
      );

    case "ordered":
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            A factory order has been placed for this listing.
          </p>
          <Placeholder text="Factory order details — available when Factory Orders are implemented" />
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
